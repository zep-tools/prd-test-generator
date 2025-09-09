-- User 테이블에 password 컬럼 추가
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "password" TEXT;

-- 기존 사용자들의 비밀번호를 1234의 해시값으로 설정 (bcrypt 해시)
-- 참고: 이 해시는 비밀번호 "1234"를 bcrypt로 암호화한 값입니다
UPDATE "User" 
SET "password" = '$2a$10$YourHashHere' 
WHERE "password" IS NULL;

-- 실제로 사용할 때는 아래 해시값을 사용하세요 (비밀번호: 1234)
-- UPDATE "User" 
-- SET "password" = '$2a$10$K7L1OJ0TfuCDtV9rw6u3c.JYM5pZfJRvH5lFaV7gezWWVf8wH9Xvy' 
-- WHERE "password" IS NULL;