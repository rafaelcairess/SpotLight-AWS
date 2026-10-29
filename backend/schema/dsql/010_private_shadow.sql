-- Shadow schema for private SpotLight data.
-- This file is intentionally NOT part of the default apply-schema command.
-- Authorization belongs to the C# API because Aurora DSQL does not support RLS.

CREATE SCHEMA IF NOT EXISTS spotlight_private;

CREATE TABLE IF NOT EXISTS spotlight_private.app_users (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_identities (
    issuer text NOT NULL,
    subject text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (issuer, subject),
    CONSTRAINT user_identities_user_issuer_unique UNIQUE (user_id, issuer),
    CONSTRAINT user_identities_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT user_identities_issuer_check CHECK (char_length(issuer) BETWEEN 8 AND 500),
    CONSTRAINT user_identities_subject_check CHECK (char_length(subject) BETWEEN 1 AND 500)
);

CREATE TABLE IF NOT EXISTS spotlight_private.profiles (
    id uuid NOT NULL,
    user_id uuid PRIMARY KEY,
    username text NOT NULL,
    display_name text,
    avatar_url text,
    bio text,
    profile_visibility text NOT NULL DEFAULT 'public',
    library_visibility text NOT NULL DEFAULT 'public',
    reviews_visibility text NOT NULL DEFAULT 'public',
    comments_permission text NOT NULL DEFAULT 'public',
    favorite_game_app_id integer,
    presence_status text NOT NULL DEFAULT 'online',
    last_seen_at timestamptz,
    steam_id text,
    steam_last_synced timestamptz,
    steam_library_private boolean NOT NULL DEFAULT false,
    xbox_id text,
    xbox_gamertag text,
    xbox_last_synced timestamptz,
    psn_id text,
    psn_online_id text,
    psn_last_synced timestamptz,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT profiles_id_unique UNIQUE (id),
    CONSTRAINT profiles_username_unique UNIQUE (username),
    CONSTRAINT profiles_steam_id_unique UNIQUE (steam_id),
    CONSTRAINT profiles_xbox_id_unique UNIQUE (xbox_id),
    CONSTRAINT profiles_psn_id_unique UNIQUE (psn_id),
    CONSTRAINT profiles_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT profiles_favorite_game_fk
        FOREIGN KEY (favorite_game_app_id) REFERENCES public.games (app_id) ON DELETE SET NULL,
    CONSTRAINT profiles_username_check CHECK (
        username = lower(btrim(username))
        AND char_length(username) BETWEEN 3 AND 20
    ),
    CONSTRAINT profiles_display_name_check CHECK (
        display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 50
    ),
    CONSTRAINT profiles_bio_check CHECK (bio IS NULL OR char_length(bio) <= 300),
    CONSTRAINT profiles_profile_visibility_check CHECK (
        profile_visibility IN ('public', 'friends', 'private')
    ),
    CONSTRAINT profiles_library_visibility_check CHECK (
        library_visibility IN ('public', 'friends', 'private')
    ),
    CONSTRAINT profiles_reviews_visibility_check CHECK (
        reviews_visibility IN ('public', 'friends', 'private')
    ),
    CONSTRAINT profiles_comments_permission_check CHECK (
        comments_permission IN ('public', 'friends', 'disabled')
    ),
    CONSTRAINT profiles_presence_status_check CHECK (
        presence_status IN ('online', 'away', 'busy', 'invisible')
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    app_id integer NOT NULL,
    status text NOT NULL DEFAULT 'wishlist',
    source text NOT NULL DEFAULT 'manual',
    hours_played numeric,
    hours_played_manual numeric,
    hours_override boolean NOT NULL DEFAULT false,
    is_favorite boolean NOT NULL DEFAULT false,
    is_hidden boolean NOT NULL DEFAULT false,
    is_private boolean NOT NULL DEFAULT false,
    is_platinumed boolean NOT NULL DEFAULT false,
    playtime_2weeks numeric,
    last_played_at timestamptz,
    added_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT user_games_user_game_unique UNIQUE (user_id, app_id),
    CONSTRAINT user_games_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT user_games_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE RESTRICT,
    CONSTRAINT user_games_status_check CHECK (
        status IN ('wishlist', 'playing', 'completed', 'dropped')
    ),
    CONSTRAINT user_games_source_check CHECK (source IN ('manual', 'steam', 'xbox', 'psn')),
    CONSTRAINT user_games_hours_check CHECK (
        (hours_played IS NULL OR hours_played >= 0)
        AND (hours_played_manual IS NULL OR hours_played_manual >= 0)
        AND (playtime_2weeks IS NULL OR playtime_2weeks >= 0)
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_game_platinum_platforms (
    user_game_id uuid NOT NULL,
    platform text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (user_game_id, platform),
    CONSTRAINT user_game_platinum_platforms_game_fk
        FOREIGN KEY (user_game_id) REFERENCES spotlight_private.user_games (id) ON DELETE CASCADE,
    CONSTRAINT user_game_platinum_platforms_platform_check CHECK (
        platform IN ('steam', 'xbox', 'playstation')
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_top_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    app_id integer NOT NULL,
    position integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT user_top_games_position_unique UNIQUE (user_id, position),
    CONSTRAINT user_top_games_game_unique UNIQUE (user_id, app_id),
    CONSTRAINT user_top_games_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT user_top_games_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE RESTRICT,
    CONSTRAINT user_top_games_position_check CHECK (position > 0)
);

CREATE TABLE IF NOT EXISTS spotlight_private.profile_platinum_showcase (
    user_id uuid NOT NULL,
    app_id integer NOT NULL,
    position integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (user_id, app_id),
    CONSTRAINT profile_platinum_showcase_position_unique UNIQUE (user_id, position),
    CONSTRAINT profile_platinum_showcase_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT profile_platinum_showcase_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE RESTRICT,
    CONSTRAINT profile_platinum_showcase_position_check CHECK (position BETWEEN 1 AND 6)
);

CREATE TABLE IF NOT EXISTS spotlight_private.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    app_id integer NOT NULL,
    content text NOT NULL,
    is_positive boolean NOT NULL,
    score integer,
    hours_at_review numeric,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT reviews_user_game_unique UNIQUE (user_id, app_id),
    CONSTRAINT reviews_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT reviews_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE RESTRICT,
    CONSTRAINT reviews_content_check CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
    CONSTRAINT reviews_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 5),
    CONSTRAINT reviews_hours_check CHECK (
        hours_at_review IS NULL OR hours_at_review BETWEEN 0 AND 1000000
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.review_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reaction text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT review_reactions_unique UNIQUE (review_id, user_id, reaction),
    CONSTRAINT review_reactions_review_fk
        FOREIGN KEY (review_id) REFERENCES spotlight_private.reviews (id) ON DELETE CASCADE,
    CONSTRAINT review_reactions_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT review_reactions_type_check CHECK (
        reaction IN ('like', 'dislike', 'funny', 'useful')
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT user_lists_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT user_lists_name_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
    CONSTRAINT user_lists_description_check CHECK (
        description IS NULL OR char_length(description) <= 200
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.user_list_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL,
    app_id integer NOT NULL,
    note text,
    added_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT user_list_games_unique UNIQUE (list_id, app_id),
    CONSTRAINT user_list_games_list_fk
        FOREIGN KEY (list_id) REFERENCES spotlight_private.user_lists (id) ON DELETE CASCADE,
    CONSTRAINT user_list_games_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE RESTRICT,
    CONSTRAINT user_list_games_note_check CHECK (note IS NULL OR char_length(note) <= 500)
);

CREATE TABLE IF NOT EXISTS spotlight_private.follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT follows_pair_unique UNIQUE (follower_id, following_id),
    CONSTRAINT follows_follower_fk
        FOREIGN KEY (follower_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT follows_following_fk
        FOREIGN KEY (following_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT follows_not_self_check CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS spotlight_private.friend_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid NOT NULL,
    addressee_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT friend_requests_requester_fk
        FOREIGN KEY (requester_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT friend_requests_addressee_fk
        FOREIGN KEY (addressee_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT friend_requests_not_self_check CHECK (requester_id <> addressee_id),
    CONSTRAINT friend_requests_status_check CHECK (
        status IN ('pending', 'accepted', 'declined')
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    actor_id uuid,
    type text NOT NULL,
    message text NOT NULL,
    link text,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT notifications_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT notifications_actor_fk
        FOREIGN KEY (actor_id) REFERENCES spotlight_private.app_users (id) ON DELETE SET NULL,
    CONSTRAINT notifications_type_check CHECK (
        type IN ('friend_request', 'friend_accept', 'message')
    ),
    CONSTRAINT notifications_message_check CHECK (
        char_length(btrim(message)) BETWEEN 1 AND 500
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.profile_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_user_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT profile_comments_profile_fk
        FOREIGN KEY (profile_user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT profile_comments_author_fk
        FOREIGN KEY (author_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT profile_comments_not_self_check CHECK (profile_user_id <> author_id),
    CONSTRAINT profile_comments_content_check CHECK (
        char_length(btrim(content)) BETWEEN 1 AND 600
    )
);

CREATE TABLE IF NOT EXISTS spotlight_private.price_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    game_id integer NOT NULL,
    target_price numeric,
    is_active boolean NOT NULL DEFAULT true,
    notified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT price_alerts_user_game_unique UNIQUE (user_id, game_id),
    CONSTRAINT price_alerts_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT price_alerts_game_fk
        FOREIGN KEY (game_id) REFERENCES public.games (app_id) ON DELETE CASCADE,
    CONSTRAINT price_alerts_target_check CHECK (target_price IS NULL OR target_price >= 0)
);

CREATE TABLE IF NOT EXISTS spotlight_private.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    name text,
    email text,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT feedback_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE SET NULL,
    CONSTRAINT feedback_name_check CHECK (name IS NULL OR char_length(name) <= 100),
    CONSTRAINT feedback_email_check CHECK (email IS NULL OR char_length(email) <= 254),
    CONSTRAINT feedback_message_check CHECK (char_length(btrim(message)) BETWEEN 1 AND 4000)
);

CREATE TABLE IF NOT EXISTS spotlight_private.rate_limits (
    user_id uuid NOT NULL,
    action text NOT NULL,
    window_started_at timestamptz NOT NULL DEFAULT current_timestamp,
    request_count integer NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, action),
    CONSTRAINT rate_limits_user_fk
        FOREIGN KEY (user_id) REFERENCES spotlight_private.app_users (id) ON DELETE CASCADE,
    CONSTRAINT rate_limits_action_check CHECK (char_length(action) BETWEEN 1 AND 80),
    CONSTRAINT rate_limits_count_check CHECK (request_count >= 0)
);

