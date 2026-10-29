-- Apply only after 010_private_shadow.sql. DSQL builds secondary indexes asynchronously.

CREATE INDEX ASYNC IF NOT EXISTS profiles_display_name_idx
    ON spotlight_private.profiles (display_name);

CREATE INDEX ASYNC IF NOT EXISTS user_games_user_updated_idx
    ON spotlight_private.user_games (user_id, updated_at DESC);

CREATE INDEX ASYNC IF NOT EXISTS user_games_recent_activity_idx
    ON spotlight_private.user_games (user_id, last_played_at DESC);

CREATE INDEX ASYNC IF NOT EXISTS reviews_game_created_idx
    ON spotlight_private.reviews (app_id, created_at DESC);

CREATE INDEX ASYNC IF NOT EXISTS profile_comments_profile_created_idx
    ON spotlight_private.profile_comments (profile_user_id, created_at DESC);

CREATE INDEX ASYNC IF NOT EXISTS notifications_user_created_idx
    ON spotlight_private.notifications (user_id, created_at DESC);

CREATE UNIQUE INDEX ASYNC IF NOT EXISTS friend_requests_active_pair_unique
    ON spotlight_private.friend_requests (
        (least(requester_id, addressee_id)),
        (greatest(requester_id, addressee_id))
    )
    WHERE status IN ('pending', 'accepted');

