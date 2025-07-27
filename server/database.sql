CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    real_name VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    bio VARCHAR(250)
);

CREATE TABLE tweets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  image_url TEXT
);

CREATE TABLE likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id INTEGER NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tweet_id)
);

CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE replies (
  id SERIAL PRIMARY KEY,
  tweet_id INTEGER NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,  
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,   
  content TEXT NOT NULL,
  image_url TEXT,                                                    
  date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id INTEGER NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tweet_id)
);

CREATE TABLE notification_checks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);