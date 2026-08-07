create or replace function public.persist_attempt_result(payload jsonb)
returns table (attempt_id uuid, attempt_number integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid := (payload ->> 'attemptId')::uuid;
  v_question_slug text := payload ->> 'questionSlug';
  v_question_id uuid;
  v_attempt_number integer;
  v_evaluation_id uuid;
  v_audio_path text := payload ->> 'audioPath';
  v_segment jsonb;
  v_score jsonb;
  v_feedback jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select id into v_question_id
  from public.questions
  where slug = v_question_slug;

  if v_question_id is null then
    raise exception 'Unknown interview question';
  end if;

  if jsonb_array_length(payload -> 'segments') < 1 then
    raise exception 'At least one transcript segment is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(payload -> 'evaluation' -> 'feedback') as item,
         jsonb_array_elements_text(item -> 'segmentIndexes') as cited_index
    where not exists (
      select 1
      from jsonb_array_elements(payload -> 'segments') as segment
      where (segment ->> 'index')::integer = cited_index::integer
    )
  ) then
    raise exception 'Feedback contains invalid evidence references';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || v_question_slug, 0)
  );

  select coalesce(max(a.attempt_number), 0) + 1
  into v_attempt_number
  from public.attempts a
  where a.user_id = v_user_id and a.question_id = v_question_id;

  insert into public.attempts (
    id, user_id, question_id, attempt_number, status, audio_path,
    duration_seconds, transcript_text, completed_at
  ) values (
    v_attempt_id, v_user_id, v_question_id, v_attempt_number, 'completed',
    v_audio_path, (payload ->> 'durationSeconds')::numeric,
    payload ->> 'transcriptText', now()
  );

  for v_segment in select value from jsonb_array_elements(payload -> 'segments')
  loop
    insert into public.transcript_segments (
      attempt_id, segment_index, start_seconds, end_seconds, text
    ) values (
      v_attempt_id,
      (v_segment ->> 'index')::integer,
      (v_segment ->> 'startSeconds')::numeric,
      (v_segment ->> 'endSeconds')::numeric,
      v_segment ->> 'text'
    );
  end loop;

  insert into public.evaluations (
    attempt_id, overall_score, summary, prioritized_recommendation,
    next_attempt_outline, model_name, prompt_version
  ) values (
    v_attempt_id,
    (payload -> 'evaluation' ->> 'overallScore')::numeric,
    payload -> 'evaluation' ->> 'summary',
    payload -> 'evaluation' ->> 'prioritizedRecommendation',
    payload -> 'evaluation' -> 'nextAttemptOutline',
    payload ->> 'modelName',
    'v1'
  )
  returning id into v_evaluation_id;

  for v_score in select value from jsonb_array_elements(payload -> 'evaluation' -> 'categoryScores')
  loop
    insert into public.category_scores (evaluation_id, category, score, explanation)
    values (
      v_evaluation_id,
      v_score ->> 'category',
      (v_score ->> 'score')::integer,
      v_score ->> 'explanation'
    );
  end loop;

  for v_feedback in select value from jsonb_array_elements(payload -> 'evaluation' -> 'feedback')
  loop
    insert into public.feedback_items (
      evaluation_id, type, category, title, explanation, suggestion, segment_indexes
    ) values (
      v_evaluation_id,
      (v_feedback ->> 'type')::public.feedback_type,
      v_feedback ->> 'category',
      v_feedback ->> 'title',
      v_feedback ->> 'explanation',
      v_feedback ->> 'suggestion',
      array(
        select value::integer
        from jsonb_array_elements_text(v_feedback -> 'segmentIndexes')
      )
    );
  end loop;

  return query select v_attempt_id, v_attempt_number;
end;
$$;

revoke all on function public.persist_attempt_result(jsonb) from public;
grant execute on function public.persist_attempt_result(jsonb) to authenticated;
