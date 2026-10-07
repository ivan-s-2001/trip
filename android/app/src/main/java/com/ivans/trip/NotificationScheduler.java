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
    private static final int JITTER_MINUTES = 18;

    // 8 почти равномерных окон с 09:15 до 21:30.
    private static final int[] BASE_MINUTES = {
            9 * 60 + 15,
            11 * 60,
            12 * 60 + 45,
            14 * 60 + 30,
            16 * 60 + 15,
            18 * 60,
            19 * 60 + 45,
            21 * 60 + 30
    };

    private static final String[] RANDOM_TITLES = {
            "Тук-тук. Это муж ♥",
            "Тебе кое-что оставили",
            "Не буду писать всё здесь",
            "Маленький сюрприз внутри",
            "Зайди на минутку ♥",
            "Есть кое-что только для тебя",
            "Я опять кое-что придумал",
            "Одно маленькое «от мужа»"
    };

    private static final String[] RANDOM_TEASERS = {
            "Я спрятал внутри маленькую штуку. Откроешь?",
            "Это не помещается в уведомление. Зайди ♥",
            "Там внутри кое-что милое. Больше спойлерить не буду.",
            "Одно нажатие — и узнаешь, что я опять придумал.",
            "У тебя новое маленькое «от мужа».",
            "Я специально оставил самое важное внутри приложения.",
            "Не спойлерю. Просто открой, когда будет минутка.",
            "Тут есть кое-что, что лучше увидеть внутри ♥"
    };

    private static final String[] PREPARED_TITLES = {
            "Утреннее от мужа ♥",
            "На сегодня кое-что есть",
            "Маленькая записка на день",
            "Вечернее — только для тебя"
    };

    private static final String[] PREPARED_TEASERS = {
            "Это приготовлено именно на сегодняшний день. Откроешь?",
            "Не хочу писать всё в шторке уведомлений. Зайди ♥",
            "Сегодняшний сюрприз уже ждёт внутри.",
            "Оставил тебе кое-что на этот вечер. Без спойлеров."
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
        // Один небольшой тизер вечером накануне.
        scheduleIfFuture(
                context,
                900,
                atLocalTime(9, 21, 20),
                CHANNEL_TRIP,
                "Завтра тот самый день",
                "Я кое-что приготовил на всю неделю. Пока только маленький спойлер ♥",
                "home",
                "random-0"
        );

        // 10–17 октября: ровно 8 уведомлений на день.
        for (int day = 10; day <= 17; day++) {
            scheduleEightForDay(context, day);
        }
    }

    private static void scheduleEightForDay(Context context, int day) {
        Random timingRandom = new Random(20261010L + day * 1009L);
        Random contentRandom = new Random(1701L + day * 7919L);

        for (int slot = 0; slot < BASE_MINUTES.length; slot++) {
            // В дни перелётов часть обычных касаний заменяется дорожными уведомлениями,
            // чтобы итог всё равно оставался 8 уведомлений в сутки.
            if ((day == 10 && slot == 7) ||
                    (day == 11 && slot == 1) ||
                    (day == 17 && (slot == 0 || slot == 1))) {
                continue;
            }

            int jitter = timingRandom.nextInt(JITTER_MINUTES * 2 + 1) - JITTER_MINUTES;
            int minuteOfDay = BASE_MINUTES[slot] + jitter;
            int hour = minuteOfDay / 60;
            int minute = minuteOfDay % 60;
            long when = atLocalTime(day, hour, minute);

            // 16 октября — отдельный сценарий годовщины: все 8 касаний подготовлены вручную.
            if (day == 16) {
                String[] anniversaryTitles = {
                        "Сегодня наш день ♥",
                        "Как всё начиналось",
                        "Одна наша фотография",
                        "Пять лет — один момент",
                        "Пять вещей за пять лет",
                        "Объятие на годовщину",
                        "Сегодня лучше услышать меня",
                        "Перед сном — только для тебя"
                };
                String[] anniversaryTeasers = {
                        "Сегодня здесь будет немного больше нас, чем обычно.",
                        "Хочу вернуть тебя на пять лет назад. Откроешь?",
                        "Я выбрал для этого дня одну фотографию.",
                        "Есть один момент, который я хочу оставить именно сегодня.",
                        "Пять лет — хороший повод кое-что вспомнить.",
                        "Это объятие сегодня особенное.",
                        "Некоторые вещи лучше не читать, а услышать.",
                        "Последняя карточка нашего дня. Открой вечером ♥"
                };
                scheduleIfFuture(
                        context,
                        5000 + day * 10 + slot,
                        when,
                        CHANNEL_TRIP,
                        anniversaryTitles[slot],
                        anniversaryTeasers[slot],
                        "home",
                        "day-16-" + slot
                );
            } else if (slot % 2 == 0) {
                int dayPoolIndex = slot / 2; // 0..3
                int titleIndex = dayPoolIndex % PREPARED_TITLES.length;
                scheduleIfFuture(
                        context,
                        3000 + day * 10 + slot,
                        when,
                        CHANNEL_TRIP,
                        day == 17 && dayPoolIndex == 0 ? "Сегодня домой ♥" : PREPARED_TITLES[titleIndex],
                        PREPARED_TEASERS[titleIndex],
                        "home",
                        "day-" + day + "-" + dayPoolIndex
                );
            } else {
                int randomIndex = contentRandom.nextInt(RANDOM_POOL_SIZE);
                int titleIndex = contentRandom.nextInt(RANDOM_TITLES.length);
                int teaserIndex = contentRandom.nextInt(RANDOM_TEASERS.length);
                scheduleIfFuture(
                        context,
                        4000 + day * 10 + slot,
                        when,
                        CHANNEL_LOVE,
                        RANDOM_TITLES[titleIndex],
                        RANDOM_TEASERS[teaserIndex],
                        "home",
                        "random-" + randomIndex
                );
            }
        }

        scheduleTravelForDay(context, day);
    }

    private static void scheduleTravelForDay(Context context, int day) {
        if (day == 10) {
            scheduleIfFuture(
                    context,
                    7010,
                    atZoneTime(10, 22, 15, "Europe/Moscow"),
                    CHANNEL_TRIP,
                    "Скоро SU1502 ✈",
                    "Шереметьево · терминал B · вылет в 23:00. Следующая точка — Тюмень.",
                    "home",
                    null
            );
        } else if (day == 11) {
            scheduleIfFuture(
                    context,
                    7011,
                    atZoneTime(11, 3, 55, "Asia/Yekaterinburg"),
                    CHANNEL_TRIP,
                    "Тюмень ✓",
                    "Самолётный этап позади. Дальше — дорога из Тюмени в Барнаул.",
                    "home",
                    null
            );
        } else if (day == 17) {
            scheduleIfFuture(
                    context,
                    7017,
                    atZoneTime(17, 4, 10, "Asia/Yekaterinburg"),
                    CHANNEL_TRIP,
                    "Скоро SU1503 ✈",
                    "Тюмень → Москва · вылет 04:45. Ещё один большой кусок дороги домой.",
                    "home",
                    null
            );
            scheduleIfFuture(
                    context,
                    7018,
                    atZoneTime(17, 5, 40, "Europe/Moscow"),
                    CHANNEL_TRIP,
                    "Москва ✓",
                    "Шереметьево позади. Но домой — это ещё дальше: впереди дорога до Рыбинска.",
                    "home",
                    null
            );
        }
    }

    private static void scheduleIfFuture(
            Context context,
            int requestCode,
            long when,
            String channel,
            String title,
            String text,
            String screen,
            String surprise
    ) {
        if (when <= System.currentTimeMillis()) return;
        schedule(context, requestCode, when, channel, title, text, screen, surprise);
    }

    private static long atLocalTime(int day, int hour, int minute) {
        Calendar calendar = Calendar.getInstance(TimeZone.getDefault());
        calendar.clear();
        calendar.set(2026, Calendar.OCTOBER, day, hour, minute, 0);
        return calendar.getTimeInMillis();
    }

    private static long atZoneTime(int day, int hour, int minute, String zoneId) {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(zoneId));
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
            alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    when,
                    pendingIntent
            );
        } else {
            alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    when,
                    pendingIntent
            );
        }
    }
}
