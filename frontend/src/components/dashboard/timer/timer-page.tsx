// TimerPage.tsx
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { timerSessionsClient, type TimerSession } from '@/lib/timer/client';
import { useUser } from '@/hooks/use-user';
import { AddTimerButton } from '@/components/dashboard/timer/add-timer-button';
import { StudyTaskCard } from '@/components/dashboard/timer/study-task-card';

interface Task {
  id: number;
  subject: string;
  duration: number;
}

export function TimerPage(): React.JSX.Element {
  const { user } = useUser();
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRecords, setTimeRecords] = useState<Record<number, number>>({});
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const fetchSessions = React.useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const todayTasks = await timerSessionsClient.fetchTodayTasks();
      setSessions(todayTasks);

      // 同步設定 timeRecords
      const newTimeRecords: Record<number, number> = {};
      todayTasks.forEach((session) => {
        newTimeRecords[session.id] = session.duration;
      });
      setTimeRecords(newTimeRecords);
    } catch (err) {
      setError('載入失敗，請稍後再試');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchSessions();
    }
  }, [user, fetchSessions]);

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const sortedTasks = sessions
      .map((session) => ({
        id: session.id,
        subject: session.subject,
        duration: session.duration,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
    setTasks(sortedTasks);
  }, [sessions]);

  const handleTimeUpdate = React.useCallback((id: number, seconds: number) => {
    setTimeRecords((prev) => ({
      ...prev,
      [id]: seconds,
    }));
  }, []);

  const totalDuration = Object.values(timeRecords).reduce((sum, seconds) => sum + seconds, 0);

  const handleRequestStart = React.useCallback((taskId: number, taskState: boolean) => {
    if (taskState) {
      setActiveTaskId(taskId);
    } else {
      setActiveTaskId(null);
    }
  }, []);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" color="text.secondary">
            今日累積讀書時間
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </Typography>
        </Stack>
        <AddTimerButton onSuccess={fetchSessions} />
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {tasks.map((task) => (
          <StudyTaskCard
            key={task.id}
            taskId={task.id}
            subjectName={task.subject}
            initialDuration={task.duration}
            onTimeUpdate={handleTimeUpdate}
            onSaveSuccess={fetchSessions}
            onRequestStart={handleRequestStart}
            isRunning={activeTaskId === task.id}
          />
        ))}
      </Box>
    </Stack>
  );
}
