DO $$
DECLARE
  p_dan    uuid; p_frank  uuid; p_kevin  uuid;
  p_zack   uuid; p_david  uuid;

  c_woodridge uuid; c_kress     uuid; c_oaks      uuid;
  c_nap       uuid; c_piltcher  uuid; c_canyons   uuid;
  c_maryknoll uuid; c_rotary    uuid; c_channahon uuid;
  c_shorewood uuid; c_katherine uuid; c_madison   uuid;

  cfg_woodridge   uuid; cfg_kress       uuid; cfg_oaks        uuid;
  cfg_nap_a       uuid; cfg_nap_b       uuid; cfg_piltcher    uuid;
  cfg_canyons     uuid; cfg_maryknoll   uuid; cfg_rotary      uuid;
  cfg_channahon_1 uuid; cfg_channahon_2 uuid; cfg_shorewood   uuid;
  cfg_katherine   uuid; cfg_madison     uuid;

  r uuid;
BEGIN

  -- Clean slate
  DELETE FROM scores;
  DELETE FROM rounds;
  DELETE FROM course_configs;
  DELETE FROM course_tags;
  DELETE FROM courses;
  DELETE FROM players;

  -- Players
  INSERT INTO players (name) VALUES ('Dan')   RETURNING id INTO p_dan;
  INSERT INTO players (name) VALUES ('Frank') RETURNING id INTO p_frank;
  INSERT INTO players (name) VALUES ('Kevin') RETURNING id INTO p_kevin;
  INSERT INTO players (name) VALUES ('Zack')  RETURNING id INTO p_zack;
  INSERT INTO players (name) VALUES ('David') RETURNING id INTO p_david;

  -- Courses
  INSERT INTO courses (name, holes) VALUES ('Woodridge', 18)           RETURNING id INTO c_woodridge;
  INSERT INTO courses (name, holes) VALUES ('Kress Creek', 18)         RETURNING id INTO c_kress;
  INSERT INTO courses (name, holes) VALUES ('Oaks', 18)                RETURNING id INTO c_oaks;
  INSERT INTO courses (name, holes) VALUES ('Naperville', 18)          RETURNING id INTO c_nap;
  INSERT INTO courses (name, holes) VALUES ('Piltcher', 18)            RETURNING id INTO c_piltcher;
  INSERT INTO courses (name, holes) VALUES ('Canyons', 18)             RETURNING id INTO c_canyons;
  INSERT INTO courses (name, holes) VALUES ('Maryknoll Park', 18)      RETURNING id INTO c_maryknoll;
  INSERT INTO courses (name, holes) VALUES ('Rotary Park', 18)         RETURNING id INTO c_rotary;
  INSERT INTO courses (name, holes) VALUES ('Channahon', 18)           RETURNING id INTO c_channahon;
  INSERT INTO courses (name, holes) VALUES ('Shorewood Park', 18)      RETURNING id INTO c_shorewood;
  INSERT INTO courses (name, holes) VALUES ('Katherine Legge', 18)     RETURNING id INTO c_katherine;
  INSERT INTO courses (name, holes) VALUES ('Madison Meadow Park', 18) RETURNING id INTO c_madison;

  -- Configs
  INSERT INTO course_configs (course_id, name) VALUES (c_woodridge,  'Standard')              RETURNING id INTO cfg_woodridge;
  INSERT INTO course_configs (course_id, name) VALUES (c_kress,      'A')                     RETURNING id INTO cfg_kress;
  INSERT INTO course_configs (course_id, name) VALUES (c_oaks,       'White')                 RETURNING id INTO cfg_oaks;
  INSERT INTO course_configs (course_id, name) VALUES (c_nap,        'A White')               RETURNING id INTO cfg_nap_a;
  INSERT INTO course_configs (course_id, name) VALUES (c_nap,        'B White')               RETURNING id INTO cfg_nap_b;
  INSERT INTO course_configs (course_id, name) VALUES (c_piltcher,   'White A')               RETURNING id INTO cfg_piltcher;
  INSERT INTO course_configs (course_id, name) VALUES (c_canyons,    'Blue A')                RETURNING id INTO cfg_canyons;
  INSERT INTO course_configs (course_id, name) VALUES (c_maryknoll,  'Glen Ellyn all par 3s') RETURNING id INTO cfg_maryknoll;
  INSERT INTO course_configs (course_id, name) VALUES (c_rotary,     'White numbers')         RETURNING id INTO cfg_rotary;
  INSERT INTO course_configs (course_id, name) VALUES (c_channahon,  'White A (hole 2 B)')    RETURNING id INTO cfg_channahon_1;
  INSERT INTO course_configs (course_id, name) VALUES (c_channahon,  'White A UDisc')         RETURNING id INTO cfg_channahon_2;
  INSERT INTO course_configs (course_id, name) VALUES (c_shorewood,  'Red all 3s')            RETURNING id INTO cfg_shorewood;
  INSERT INTO course_configs (course_id, name) VALUES (c_katherine,  'Hinsdale numbers')      RETURNING id INTO cfg_katherine;
  INSERT INTO course_configs (course_id, name) VALUES (c_madison,    'UDisc Scoring')         RETURNING id INTO cfg_madison;

  -- Woodridge Standard
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_woodridge, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_dan, -7), (r, p_frank, -6), (r, p_kevin, -4), (r, p_zack, -2);

  -- Kress Creek A
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_kress, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, -6), (r, p_zack, -5), (r, p_kevin, -3);

  -- Oaks White
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_oaks, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_dan, 0), (r, p_frank, 1), (r, p_kevin, 2), (r, p_zack, 7);

  -- Naperville B White
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_nap_b, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_zack, 2), (r, p_frank, 3), (r, p_kevin, 4), (r, p_dan, 5);

  -- Naperville A White
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_nap_a, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_dan, 1), (r, p_frank, 1), (r, p_zack, 6);

  -- Piltcher White A
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_piltcher, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, 3), (r, p_dan, 4), (r, p_zack, 5), (r, p_kevin, 8), (r, p_david, 16);

  -- Canyons Blue A
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_canyons, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, 3), (r, p_kevin, 11);

  -- Maryknoll Park - Glen Ellyn all par 3s
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_maryknoll, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_kevin, -3), (r, p_frank, -2), (r, p_zack, 0), (r, p_david, 4);

  -- Rotary Park - White numbers
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_rotary, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, 3);

  -- Channahon White A (hole 2 B)
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_channahon_1, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, -5), (r, p_david, -3);

  -- Channahon White A UDisc
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_channahon_2, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_kevin, 2), (r, p_zack, 7);

  -- Shorewood Park - Red all 3s
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_shorewood, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_frank, -6), (r, p_kevin, -2), (r, p_zack, -2);

  -- Katherine Legge - Hinsdale numbers
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_katherine, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_zack, -7), (r, p_david, -6);

  -- Madison Meadow Park - UDisc Scoring
  INSERT INTO rounds (course_config_id, historical) VALUES (cfg_madison, true) RETURNING id INTO r;
  INSERT INTO scores (round_id, player_id, strokes) VALUES
    (r, p_zack, 0), (r, p_kevin, 0), (r, p_david, -1);

END $$;
