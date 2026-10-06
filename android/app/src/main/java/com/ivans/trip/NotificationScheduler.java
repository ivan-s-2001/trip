package com.ivans.trip;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

import java.util.Calendar;
import java.util.Random;
import java.util.TimeZone;

public final class NotificationScheduler {
    public static final String CHANNEL_LOVE = "love_notes";
    public static final String CHANNEL_TRIP = "trip_moments";
    private static final TimeZone BARNAUL = TimeZone.getTimeZone("Asia/Barnaul");

    private static final String[] RANDOM_TITLES = {
            "От мужа ♥",
            "Маленькая записка",
            "На случай, если соскучилась",
            "Просто напоминаю",
            "Тебе кое-что оставили ♥"
    };

    private static final String[] RANDOM_MESSAGES = {
            "Дома тебя очень любят. Особенно один конкретный муж.",
            "Сегодня до дома уже ближе, чем было вчера ♥",
            "Мысленно обнял тебя. Да, это официально считается.",
            "Пожалуйста, нормально поешь. Распоряжение мужа.",
            "Мне нравится мысль, что время сейчас работает на нас.",
            "Если ты улыбаешься экрану — моя задача выполнена.",
            "Тебя временно одолжил Барнаул. Бессрочную аренду я не подписывал.",
            "Я скучаю по твоему голосу, шагам и обычным вечерам.",
            "Ты там, я здесь, а моё любимое место всё равно рядом с тобой.",
            "Пусть сегодня случится хотя бы одна вещь, которая тебя порадует.",
            "Не торопи время. Оно уже идёт в правильную сторону.",
            "Я сохранил для тебя место рядом. Оно вообще-то всегда твоё.",
            "С тобой даже самые обычные дни становятся теми, по которым скучаешь.",
            "Ничего срочного. Просто: я тебя люблю.",
            "В доме временно отсутствует главный источник уюта. Просим вернуть 17 октября.",
            "Если день тяжёлый — вечером он всё равно станет ещё одним днём ближе к дому.",
            "Хочу потом услышать всё: что было смешно, странно, вкусно и красиво.",
            "Я поскучаю за двоих. Ты там лучше живи и улыбайся.",
            "Спойлер: в конце этой недели я всё равно получаю тебя обратно.",
            "Закрой глаза на секунду. Представь, что я рядом. Остальное наверстаем дома.",
            "Ты мой любимый человек. Иногда этого достаточно.",
            "Я бы сейчас выбрал самый обычный вечер с тобой вместо любого интересного вечера без тебя.",
            "Если всё бесит — разрешаю написать мужу и пожаловаться на всё подряд.",
            "Ещё один маленький привет из дома ♥"
    };

    private static final FixedNote[] FIXED = {
            new FixedNote(9, 21, 30, "До грустного момента — совсем чуть-чуть", "Я уже скучаю заранее ♥", "home"),
            new FixedNote(10, 8, 30, "Сегодня тот самый день", "Береги себя в дороге. И напиши мне, когда доберёшься ♥", "home"),
            new FixedNote(11, 9, 30, "Первое утро далеко", "Я рядом. Даже если сегодня между нами много километров.", "days"),
            new FixedNote(12, 20, 0, "Ещё один день закончился", "До дома стало ещё на один день ближе ♥", "days"),
            new FixedNote(13, 12, 30, "Почти половина", "Время идёт в правильную сторону.", "days"),
            new FixedNote(14, 18, 0, "Половина позади ♥", "Теперь возвращение ближе, чем отъезд.", "days"),
            new FixedNote(15, 11, 0, "Уже можно говорить «скоро домой»", "Осталось совсем чуть-чуть.", "home"),
            new FixedNote(16, 21, 0, "Последняя ночь", "Завтра ты возвращаешься. Я очень жду.", "letters"),
            new FixedNote(17, 8, 30, "Сегодня домой ♥", "Семь дней закончились. Возвращайся ко мне.", "home")
    };

    private NotificationScheduler() {}

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel love = new NotificationChannel(
                CHANNEL_LOVE,
                "Записки от мужа",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        love.setDescription("Случайные тёплые сообщения во время поездки");
        love.enableVibration(true);
        love.setLightColor(Color.rgb(143, 51, 77));

        NotificationChannel trip = new NotificationChannel(
                CHANNEL_TRIP,
                "Важные моменты поездки",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        trip.setDescription("Сообщения к ключевым дням 10–17 октября");
        trip.enableVibration(true);
        trip.setLightColor(Color.rgb(143, 51, 77));

        manager.createNotificationChannel(love);
        manager.createNotificationChannel(trip);
    }

    public static void scheduleAll(Context context) {
        scheduleFixed(context);
        scheduleRandom(context);
    }

    private static void scheduleFixed(Context context) {
        int code = 1000;
        for (FixedNote note : FIXED) {
            long when = atBarnaulTime(note.day, note.hour, note.minute);
            if (when > System.currentTimeMillis()) {
                schedule(
                        context,
                        code,
                        when,
                        CHANNEL_TRIP,
                        note.title,
                        note.text,
                        note.screen
                );
            }
            code++;
        }
    }

    private static void scheduleRandom(Context context) {
        for (int day = 10; day <= 16; day++) {
            scheduleRandomSlot(context, day, 0, 10, 14);
            scheduleRandomSlot(context, day, 1, 17, 21);
        }
    }

    private static void scheduleRandomSlot(
            Context context,
            int day,
            int slot,
            int startHour,
            int endHour
    ) {
        long seed = 20261000L + day * 97L + slot * 1009L;
        Random random = new Random(seed);

        int startMinute = startHour * 60;
        int endMinute = endHour * 60 + 1;
        int minuteOfDay = startMinute + random.nextInt(Math.max(1, endMinute - startMinute));

        int hour = minuteOfDay / 60;
        int minute = minuteOfDay % 60;
        long when = atBarnaulTime(day, hour, minute);
        if (when <= System.currentTimeMillis()) return;

        String title = RANDOM_TITLES[random.nextInt(RANDOM_TITLES.length)];
        String text = RANDOM_MESSAGES[random.nextInt(RANDOM_MESSAGES.length)];
        int code = 2000 + day * 10 + slot;

        schedule(context, code, when, CHANNEL_LOVE, title, text, "home");
    }

    private static long atBarnaulTime(int day, int hour, int minute) {
        Calendar calendar = Calendar.getInstance(BARNAUL);
        calendar.clear();
        calendar.set(2026, Calendar.OCTOBER, day, hour, minute, 0);
        return calendar.getTimeInMillis();
    }

    private static void schedule(
            Context context,
            int requestCode,
            long when,
            String channel,
            String title,
            String text,
            String screen
    ) {
        AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("notification_id", requestCode);
        intent.putExtra("channel", channel);
        intent.putExtra("title", title);
        intent.putExtra("text", text);
        intent.putExtra("screen", screen);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, when, pendingIntent);
        }
    }

    private static final class FixedNote {
        final int day;
        final int hour;
        final int minute;
        final String title;
        final String text;
        final String screen;

        FixedNote(int day, int hour, int minute, String title, String text, String screen) {
            this.day = day;
            this.hour = hour;
            this.minute = minute;
            this.title = title;
            this.text = text;
            this.screen = screen;
        }
    }
}
