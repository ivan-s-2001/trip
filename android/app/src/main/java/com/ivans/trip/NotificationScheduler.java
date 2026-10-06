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
    private static final int RANDOM_POOL_SIZE = 24;

    private static final String[] RANDOM_TITLES = {
            "Тук-тук. Это муж ♥",
            "Тебе кое-что оставили",
            "Не буду писать всё здесь",
            "Маленький сюрприз внутри",
            "Зайди на минутку ♥",
            "Есть кое-что только для тебя"
    };

    private static final String[] RANDOM_TEASERS = {
            "Я спрятал внутри маленькую штуку. Откроешь?",
            "Это не помещается в уведомление. Зайди ♥",
            "Там внутри кое-что милое. Больше спойлерить не буду.",
            "Одно нажатие — и узнаешь, что я опять придумал.",
            "У тебя новое маленькое «от мужа».",
            "Я специально оставил самое важное внутри приложения."
    };

    private static final PreparedNote[] PREPARED = {
            new PreparedNote(9, 21, 30, "До грустного момента совсем чуть-чуть", "Я кое-что оставил тебе на вечер ♥", "home", "random-0"),
            new PreparedNote(10, 8, 45, "Сегодня тот самый день", "Не буду всё писать здесь. Открой, когда будет минутка ♥", "home", "day-10-0"),
            new PreparedNote(11, 9, 15, "Первое утро далеко", "У меня есть для тебя кое-что именно на сегодня.", "home", "day-11-0"),
            new PreparedNote(12, 20, 15, "Вечерняя записка от мужа", "День почти закончился. Зайди на минутку ♥", "home", "day-12-1"),
            new PreparedNote(13, 13, 0, "Мы уже почти у середины", "Открой — там немного приятной математики.", "home", "day-13-0"),
            new PreparedNote(14, 18, 30, "Половина позади ♥", "Для этого момента я кое-что приготовил.", "home", "day-14-0"),
            new PreparedNote(15, 11, 30, "Уже можно говорить «скоро»", "Зайди. Сегодня внутри особенно хорошее слово.", "home", "day-15-0"),
            new PreparedNote(16, 21, 15, "Последняя ночь", "Тут сообщение, которое я хотел оставить именно сегодня.", "home", "day-16-0"),
            new PreparedNote(17, 8, 30, "Сегодня домой ♥", "Последний сюрприз этой поездки уже ждёт внутри.", "home", "day-17-0")
    };

    private NotificationScheduler() {}

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel love = new NotificationChannel(
                CHANNEL_LOVE,
                "Случайные сюрпризы",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        love.setDescription("Случайные маленькие сообщения и интерактивы от мужа");
        love.enableVibration(true);
        love.setLightColor(Color.rgb(143, 51, 77));

        NotificationChannel trip = new NotificationChannel(
                CHANNEL_TRIP,
                "Сообщения на день",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        trip.setDescription("Подготовленные сообщения для конкретных дней поездки");
        trip.enableVibration(true);
        trip.setLightColor(Color.rgb(143, 51, 77));

        manager.createNotificationChannel(love);
        manager.createNotificationChannel(trip);
    }

    public static void scheduleAll(Context context) {
        schedulePrepared(context);
        scheduleRandom(context);
    }

    private static void schedulePrepared(Context context) {
        int code = 1000;
        for (PreparedNote note : PREPARED) {
            long when = atLocalTime(note.day, note.hour, note.minute);
            if (when > System.currentTimeMillis()) {
                schedule(
                        context,
                        code,
                        when,
                        CHANNEL_TRIP,
                        note.title,
                        note.text,
                        note.screen,
                        note.surprise
                );
            }
            code++;
        }
    }

    private static void scheduleRandom(Context context) {
        for (int day = 10; day <= 16; day++) {
            long seed = 20261026L + day * 997L;
            Random random = new Random(seed);

            int startMinute = 14 * 60;
            int endMinute = 20 * 60 + 30;
            int minuteOfDay = startMinute + random.nextInt(endMinute - startMinute + 1);
            int hour = minuteOfDay / 60;
            int minute = minuteOfDay % 60;
            long when = atLocalTime(day, hour, minute);

            if (when <= System.currentTimeMillis()) continue;

            int contentIndex = random.nextInt(RANDOM_POOL_SIZE);
            String title = RANDOM_TITLES[random.nextInt(RANDOM_TITLES.length)];
            String teaser = RANDOM_TEASERS[random.nextInt(RANDOM_TEASERS.length)];

            schedule(
                    context,
                    2000 + day,
                    when,
                    CHANNEL_LOVE,
                    title,
                    teaser,
                    "home",
                    "random-" + contentIndex
            );
        }
    }

    private static long atLocalTime(int day, int hour, int minute) {
        Calendar calendar = Calendar.getInstance(TimeZone.getDefault());
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
            String screen,
            String surprise
    ) {
        AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("notification_id", requestCode);
        intent.putExtra("channel", channel);
        intent.putExtra("title", title);
        intent.putExtra("text", text);
        intent.putExtra("screen", screen);
        intent.putExtra("surprise", surprise);

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

    private static final class PreparedNote {
        final int day;
        final int hour;
        final int minute;
        final String title;
        final String text;
        final String screen;
        final String surprise;

        PreparedNote(
                int day,
                int hour,
                int minute,
                String title,
                String text,
                String screen,
                String surprise
        ) {
            this.day = day;
            this.hour = hour;
            this.minute = minute;
            this.title = title;
            this.text = text;
            this.screen = screen;
            this.surprise = surprise;
        }
    }
}
