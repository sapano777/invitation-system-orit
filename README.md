# invitation-system-orit

מערכת לעסק אחד: יצירת דפי הזמנה דיגיטליים לאירועים, הפצה ידנית של קישור אחד לכל אירוע, הרשמה עצמית של המוזמנים, מעקב ותזכורות.
האפיון ותכנית העבודה ב-[docs/work-plan.md](docs/work-plan.md) (נלקחו מ-[shyoni7/invitation-system-yoni](https://github.com/shyoni7/invitation-system-yoni)).

## מה המערכת עושה

- **אירועים:** יצירה ועריכה, 10 תבניות עיצוב, תמונה או GIF, מיקום במפה, קישור למתנה, מועד אחרון להרשמה ומספר מקומות.
- **דף הזמנה לאורחים:** קישור אחד לכל אירוע, בעברית ובאנגלית, עם ניווט ב-Waze ו-Google Maps, הוספה ליומן, ספירה לאחור וטופס הרשמה.
- **ניהול נרשמים:** סיכום מספרי, חיפוש וסינון, הוספה ועריכה ידנית, כפתורי וואטסאפ ואימייל לכל נרשם, וייצוא ל-Excel.
- **תזכורות באימייל:** נשלחות אוטומטית לפני האירוע, או ידנית מדף האירוע.
- **סידור שולחנות:** גרירת נרשמים לשולחנות, שמופיע גם בייצוא.

## טכנולוגיה

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- Supabase: Postgres, Auth, Storage
- next-intl: עברית (ברירת מחדל, RTL) ואנגלית. השפה נשמרת בעוגייה ולא בכתובת.
- Vercel לאירוח

## הרצה מקומית

דרוש Node.js 22.

```bash
npm install
```

```bash
cp .env.example .env.local
```

ממלאים את משתני Supabase ב-`.env.local` ואז:

```bash
npm run dev
```

האתר עולה ב-http://localhost:3000.

### Supabase מקומי (אופציונלי)

אם Docker מותקן, אפשר להריץ Supabase מקומי במקום פרויקט בענן. המיגרציות מוחלות אוטומטית:

```bash
npx supabase start
```

הפקודה מדפיסה את ה-URL והמפתחות להעתקה ל-`.env.local`. יצירת עובד לבדיקות: Studio ב-http://127.0.0.1:54323, או דרך SQL כמו בסעיף "הוספת עובד".

## הקמת Supabase

1. יוצרים פרויקט ב-https://supabase.com/dashboard
2. מריצים את הקבצים ב-`supabase/migrations/` לפי הסדר (0001 עד 0006), ב-SQL Editor או עם `supabase db push`
3. מעתיקים מ-Project Settings > API Keys את ה-URL, ה-publishable key וה-secret key ל-`.env.local`
4. מומלץ: Authentication > Sign In / Providers, לכבות "Allow new users to sign up". עובדים מוסיפים ידנית.
5. Authentication > URL Configuration: להגדיר את Site URL לכתובת האתר ב-Vercel.

בדיקה שהכל מחובר: http://localhost:3000/api/health צריך להחזיר `"healthy": true`.

## הוספת עובד

1. ב-Supabase Dashboard: Authentication > Users > Add user, עם אימייל וסיסמה ו-Auto Confirm.
2. ב-SQL Editor:

```sql
select public.add_staff('person@example.com', 'שם לתצוגה');
```

משתמש שלא נוסף כך יכול להתחבר, אבל לא רואה שום נתון.

## פריסה ל-Vercel

1. מייבאים את הריפו ב-Vercel (New Project)
2. מגדירים את משתני הסביבה מ-`.env.example` (Supabase, שירות האימייל, `CRON_SECRET`)
3. אחרי הפריסה בודקים את `/api/health`

## מבנה הפרויקט

```
src/app/              נתיבים (App Router)
src/app/admin/        ממשק הניהול: אירועים, נרשמים, ייצוא ל-Excel, סידור שולחנות, תצוגה מקדימה
src/app/login/        כניסת עובדים
src/app/e/[slug]/     דף ההזמנה הציבורי, הרשמה, קובץ יומן
src/components/       קומפוננטות משותפות (טופס אירוע, העלאת מדיה, בחירת תבנית, ניהול נרשמים, לוח שולחנות)
src/lib/auth.ts       בדיקת הרשאת עובד (requireStaff)
src/lib/events/       ולידציה, יצירת slug, קואורדינטות
src/templates/        10 תבניות ההזמנה: רשימה, פונטים, פריסה לכל תבנית ורכיבים משותפים (blocks/)
tests/                בדיקות קצה לקצה (Playwright)
src/lib/phone.ts      נרמול מספרי טלפון לפורמט בינלאומי
src/lib/email/        שליחת אימייל (Resend / SMTP) ותבנית מייל התזכורת
src/lib/reminders.ts  לוגיקת התזכורות: מתי לשלוח, שליחה, יומן
src/i18n/             הגדרות שפה, קריאת השפה מעוגייה
src/lib/supabase/     לקוחות Supabase: דפדפן, שרת, admin, proxy
src/lib/types/        טיפוסי הדאטאבייס
src/proxy.ts          רענון ה-session והפניה ל-login ב-/admin
messages/             תרגומים: he.json, en.json
supabase/migrations/  סכמת הדאטאבייס
docs/                 אפיון ותכנית עבודה
```

## בדיקות קצה לקצה

הבדיקות ב-`tests/` (Playwright) עוברות על הזרימות המרכזיות: 10 התבניות (כולל שאין גלילה לצדדים בטלפון), הרשמה ועדכון הרשמה, אירוע מלא וסגור, הגנה מבוטים, כניסת עובדים, ניהול נרשמים, ייצוא ל-Excel, תצוגה מקדימה וסידור שולחנות (כולל גרירה). כל בדיקה רצה גם בדסקטופ וגם בגודל מסך של אייפון.

הבדיקות יוצרות לעצמן נתונים (אירועים שמתחילים ב-`e2e-` ומשתמש עובד לבדיקות) ומוחקות אותם בסוף. לכן הן רצות רק מול Supabase מקומי, אלא אם מגדירים `E2E_ALLOW_REMOTE=1` לפרויקט בדיקות נפרד.

```bash
npx supabase start
```

```bash
npm run build
```

```bash
npm run test:e2e
```

Playwright מפעיל את השרת בפורט 3100. לבדיקה מול שרת שכבר רץ: `BASE_URL=http://localhost:3000 npm run test:e2e`.

## פקודות

```bash
npm run dev     # פיתוח
npm run build   # בנייה
npm run start   # הרצת גרסת production
npm run lint    # ESLint
npm run test:e2e  # בדיקות קצה לקצה (ראו למעלה)
```
