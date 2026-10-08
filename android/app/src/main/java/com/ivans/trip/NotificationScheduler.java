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
import java.util.TimeZone;

public final class NotificationScheduler {
    public static final String CHANNEL_LOVE = "love_notes";
    public static final String CHANNEL_TRIP = "trip_moments";

    private static final String[] DAY10 = {
            "Перед дорогой",
            "Обнять перед отъездом",
            "Мы до этой поездки",
            "Береги себя в дороге",
            "Что уже хочется вернуть домой",
            "Первый кадр поездки",
            "Услышать меня перед рейсом",
            "SU 1502 · скоро вылет"
    };

    private static final String[] DAY11 = {
            "Тюмень",
            "Первое утро не дома",
            "Мы дома",
            "Самая обычная наша вещь",
            "Обнять молча",
            "Что тебе сейчас нужнее?",
            "Один кусочек Кургана",
            "Первый день закончился"
    };

    private static final String[] DAY12 = {
            "Доброе утро без повода",
            "Фото, которое люблю я",
            "Одна причина",
            "Фото для нас будущих",
            "История одной фотографии",
            "Долгое объятие",
            "Первый вечер после возвращения",
            "Спокойной ночи голосом"
    };

    private static final String[] DAY13 = {
            "Уже не начало",
            "Как мы однажды смеялись",
            "Домашняя сводка",
            "Что с тобой стало домом",
            "Иди сюда",
            "Если день был тяжёлый",
            "Что расскажешь первым?",
            "До середины — один сон"
    };

    private static final String[] DAY14 = {
            "Половина позади",
            "До и после",
            "Один момент, который я бы повторил",
            "Что за эти годы не изменилось",
            "Полпути — одно объятие",
            "После возвращения",
            "Середина — голосом",
            "Теперь только ближе"
    };

    private static final String[] DAY15 = {
            "Уже можно говорить «скоро»",
            "Твоё место занято",
            "Что я замечаю только когда тебя нет",
            "Не выжимай последние дни",
            "Что сделать первым дома?",
            "Объятие уже почти настоящее",
            "Наш самый обычный вечер",
            "Последний обычный вечер поездки"
    };

    private static final String[] DAY16 = {
            "5 лет с того дня",
            "Как всё началось",
            "Мы тогда",
            "Когда я понял, что это уже «мы»",
            "Пять лет — пять вещей",
            "Особое объятие",
            "Главное голосовое недели",
            "Пять лет. И завтра домой"
    };

    private static final String[] DAY17 = {
            "SU 1503 · домой",
            "Москва",
            "Мы ждём тебя",
            "Последний кадр поездки",
            "Что забираешь с собой",
            "Мы всё ещё ждём",
            "Последнее голосовое из приложения",
            "Ты вернулась к нам"
    };

    private static final int[][] TIMES = {
            {10,30, 12,30, 15,0, 17,30, 19,15, 20,30, 21,30, 22,20},
            {4,0, 10,15, 12,15, 14,45, 17,15, 19,0, 20,45, 22,15},
            {8,50, 10,45, 12,50, 15,20, 17,40, 19,15, 20,50, 22,15},
            {8,50, 10,45, 12,50, 15,20, 17,40, 19,15, 20,50, 22,15},
            {8,50, 10,45, 12,50, 15,20, 17,40, 19,15, 20,50, 22,15},
            {8,50, 10,45, 12,50, 15,20, 17,40, 19,15, 20,50, 22,15},
            {8,30, 10,45, 12,30, 15,0, 17,30, 19,15, 20,45, 22,20},
            {4,10, 5,40, 8,30, 11,30, 14,30, 17,30, 19,30, 21,0}
    };

    private static final String[][] TITLES = {
            DAY10, DAY11, DAY12, DAY13, DAY14, DAY15, DAY16, DAY17
    };

    private NotificationScheduler() {}

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel moments = new NotificationChannel(
                CHANNEL_TRIP,
                "Моменты поездки",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        moments.setDescription("Личные моменты, фотографии, голосовые и дорога 10–17 октября");
        moments.enableVibration(true);
        moments.setLightColor(Color.rgb(143, 51, 77));
        manager.createNotificationChannel(moments);

        NotificationChannel legacy = new NotificationChannel(
                CHANNEL_LOVE,
                "Случайные сюрпризы",
                NotificationManager.IMPORTANCE_LOW
        );
        legacy.setDescription("Старый канал уведомлений");
        manager.createNotificationChannel(legacy);
    }

    public static void scheduleAll(Context context) {
        for (int day = 10; day <= 17; day++) {
            int dayIndex = day - 10;
            for (int slot = 0; slot < 8; slot++) {
                // Финальный «Домой» не планируем по часам: он открывается только после
                // фактического возвращения в Рыбинск через кнопку «я уже дома».
                // Arrival is a location event, never an assumption based on the timetable.
                if ((day == 11 && slot == 0) || (day == 17 && (slot == 1 || slot == 7))) {
                    cancelMoment(context, day, slot);
                    continue;
                }

                int hour = TIMES[dayIndex][slot * 2];
                int minute = TIMES[dayIndex][slot * 2 + 1];
                String zone = zoneFor(day, slot);
                long when = atZoneTime(day, hour, minute, zone);

                String title = TITLES[dayIndex][slot];
                String teaser = teaserFor(day, slot);

                scheduleIfFuture(
                        context,
                        6000 + day * 10 + slot,
                        when,
                        CHANNEL_TRIP,
                        title,
                        teaser,
                        "home",
                        "day-" + day + "-" + slot
                );
            }
        }
    }

    private static void cancelMoment(Context context, int day, int slot) {
        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(context, 6000 + day * 10 + slot,
                intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pending != null) {
            ((AlarmManager) context.getSystemService(Context.ALARM_SERVICE)).cancel(pending);
            pending.cancel();
        }
    }

    private static String teaserFor(int day, int slot) {
        if (day == 10 && slot == 7) {
            return "Шереметьево · терминал B · вылет 23:00.";
        }
        if (day == 11 && slot == 0) {
            return "Самолётный этап позади. Дальше — Тюмень → Курган.";
        }
        if (day == 17 && slot == 0) {
            return "Тюмень → Москва · вылет 04:45.";
        }
        if (day == 17 && slot == 1) {
            return "Шереметьево позади. Впереди дорога до Рыбинска.";
        }
        if (day == 16) {
            return "Сегодня это часть нашей истории ♥";
        }
        return "Для тебя открылся новый момент ♥";
    }

    private static String zoneFor(int day, int slot) {
        if (day == 10) return "Europe/Moscow";
        if (day >= 11 && day <= 16) return "Asia/Yekaterinburg";
        if (day == 17 && slot == 0) return "Asia/Yekaterinburg";
        return "Europe/Moscow";
    }

    private static long atZoneTime(int day, int hour, int minute, String zoneId) {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(zoneId));
        calendar.clear();
        calendar.set(2026, Calendar.OCTOBER, day, hour, minute, 0);
        return calendar.getTimeInMillis();
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
}
