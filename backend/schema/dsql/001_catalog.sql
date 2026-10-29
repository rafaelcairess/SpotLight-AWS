CREATE TABLE IF NOT EXISTS public.games (
    app_id integer PRIMARY KEY,
    title text NOT NULL,
    image text,
    short_description text,
    genre text,
    tags jsonb,
    active_players integer,
    community_rating integer,
    price text,
    price_original text,
    discount_percent integer,
    release_date text,
    developer text,
    publisher text,
    platforms jsonb,
    background_image text,
    trailer_url text,
    trailer_thumbnail text,
    steam_url text,
    screenshot_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    media_synced_at timestamptz,
    last_synced timestamptz NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS public.game_localizations (
    app_id integer NOT NULL,
    locale text NOT NULL,
    title text,
    short_description text,
    genre text,
    tags jsonb,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (app_id, locale),
    CONSTRAINT game_localizations_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.daily_featured (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id integer NOT NULL,
    featured_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT daily_featured_game_fk
        FOREIGN KEY (app_id) REFERENCES public.games (app_id) ON DELETE CASCADE,
    CONSTRAINT daily_featured_date_unique UNIQUE (featured_date)
);
