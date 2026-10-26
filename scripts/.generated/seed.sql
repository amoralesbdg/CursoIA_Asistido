BEGIN;

-- Truncate en orden de dependencias de FK (de hijas a padres).
TRUNCATE TABLE audit_log, ticket_locks, comments, ticket_tags, ticket_assignees,
  tags, tickets, project_members, projects, users;

-- 3 usuarios
-- password de desarrollo para los 3: "Password123!" (bcrypt, costo 10)
INSERT INTO users (id, name, username, email, password_hash, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin Uno', 'admin1', 'admin1@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'User Dos', 'user2', 'user2@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'User Tres', 'user3', 'user3@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'user');

-- 2 proyectos
INSERT INTO projects (id, name, description, creator_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Proyecto Alpha', 'Proyecto semilla de desarrollo', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Proyecto Beta', 'Segundo proyecto semilla de desarrollo', '22222222-2222-2222-2222-222222222222');

-- membresías
INSERT INTO project_members (project_id, user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333');

-- 5 tickets con status variado
INSERT INTO tickets (id, key, project_id, title, description, status, priority, creator_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'ALPHA-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Configurar entorno de desarrollo', 'Dejar el repo listo para onboarding', 'todo', 'high', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000002', 'ALPHA-2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Implementar login', 'RF-01: login con usuario y contraseña', 'in-progress', 'medium', '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000003', 'ALPHA-3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Revisar filtros del tablero', 'RF-12: filtros combinados', 'review', 'low', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000004', 'BETA-1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Auditoria WCAG inicial', 'Auditoria de accesibilidad del prototipo', 'done', 'medium', '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000005', 'BETA-2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Definir esquema de base de datos', 'RF relacionadas con el modelo de datos', 'todo', 'high', '22222222-2222-2222-2222-222222222222');

-- asignaciones
INSERT INTO ticket_assignees (ticket_id, user_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222');

COMMIT;
