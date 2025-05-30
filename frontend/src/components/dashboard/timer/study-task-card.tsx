'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PencilSimple as EditIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { logger } from '@/lib/default-logger';
import { timerSessionsClient } from '@/lib/timer/client';

interface StudyTaskCardProps {
  isRunning: boolean;
  onRequestStart: (taskId: number, taskState: boolean) => void;
  taskId: number; // 必須有 taskId 才能更新正確的資料
  subjectName: string;
  initialDuration: number;
  onTimeUpdate: (id: number, seconds: number) => void;
  onSaveSuccess?: () => void; // 可選，保存成功時通知父元件
}

export function StudyTaskCard({
  isRunning,
  taskId,
  subjectName,
  initialDuration,
  onRequestStart,
  onTimeUpdate,
  onSaveSuccess,
}: StudyTaskCardProps): React.JSX.Element {
  const [elapsedTime, setElapsedTime] = useState(initialDuration);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 新增隱藏任務的狀態
  const [hideError, setHideError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(subjectName);

  useEffect(() => {
    setEditedTitle(subjectName);
  }, [subjectName]);

  const lastSaveTimeRef = React.useRef<number>(Date.now());

  // 隱藏任務的處理函式
  const handleHide = useCallback(async () => {
    setHideError(null);
    const result = await timerSessionsClient.hideTask(subjectName);
    if (result.success) {
      onSaveSuccess?.();
    } else {
      setHideError('隱藏失敗，請稍後再試');
    }
  }, [subjectName, onSaveSuccess]);

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(subjectName);
  };

  const handleSaveTitle = async () => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle === subjectName) {
      setIsEditingTitle(false);
      return;
    }

    if (!trimmedTitle) {
      setSaveError('標題不能為空');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await timerSessionsClient.update(taskId, { subject: trimmedTitle });

      if (result) {
        setIsEditingTitle(false);
        onSaveSuccess?.();
      } else {
        setSaveError('更新失敗，請稍後再試');
      }
    } catch (err) {
      setSaveError('更新標題失敗，請確保此科目名稱未被使用');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle(subjectName);
  };

  // 保存到資料庫
  const saveDuration = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await timerSessionsClient.update(taskId, { duration: elapsedTime });
      onSaveSuccess?.();
    } catch (err) {
      setSaveError('自動保存失敗，請檢查網路連線');
      logger.error('自動保存失敗:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 每秒累加計時
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isRunning]);

  // 每30秒自動保存
  useEffect(() => {
    if (!isRunning) return;
    const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
    if (timeSinceLastSave >= 30000) {
      lastSaveTimeRef.current = Date.now();
      void saveDuration();
    }
  });

  // 每次 elapsedTime 變動時通知外部
  useEffect(() => {
    onTimeUpdate(taskId, elapsedTime);
  }, [elapsedTime, taskId, onTimeUpdate]);

  // 暫停時立即保存
  const handleToggle = async () => {
    if (isRunning) {
      await saveDuration();
      onRequestStart(taskId, false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isRunning ? 4 : 1,
        border: '1px solid',
        borderColor: isRunning ? 'primary.main' : 'transparent',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
          {!isEditingTitle && (
            <IconButton
              aria-label="編輯標題"
              onClick={() => {
                handleStartEditTitle();
              }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          )}
          <IconButton aria-label="隱藏" onClick={handleHide} size="small">
            <XIcon />
          </IconButton>
        </Stack>

        <Stack spacing={2}>
          {isEditingTitle ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 6 }}>
              <TextField
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                }}
                variant="outlined"
                size="small"
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    handleCancelEditTitle();
                  }
                }}
              />
              <IconButton
                onClick={() => {
                  void handleSaveTitle();
                }}
                size="small"
                disabled={isSaving}
              >
                <CheckIcon />
              </IconButton>
            </Stack>
          ) : (
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, pr: 6 }}>
              {subjectName || '未命名科目'}
            </Typography>
          )}

          <Typography
            variant="h4"
            align="center"
            sx={{
              fontFamily: 'monospace',
              color: isRunning ? 'primary.main' : 'text.primary',
              fontWeight: 'bold',
            }}
          >
            {formatTime(elapsedTime)}
          </Typography>

          {/* ...原本的 Button 和內容 ... */}
          <LoadingButton
            variant="contained"
            color={isRunning ? 'warning' : 'success'}
            onClick={() => {
              if (!isRunning) {
                onRequestStart(taskId, true);
              } else {
                void handleToggle();
              }
            }}
            disabled={isSaving}
            loading={isSaving}
            fullWidth
            sx={{ mt: 1 }}
          >
            {isRunning ? '暫停' : '開始'}
          </LoadingButton>

          {saveError || hideError ? (
            <Typography color="error" variant="caption" align="center">
              {saveError || hideError}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
