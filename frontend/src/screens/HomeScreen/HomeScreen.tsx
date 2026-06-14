/* ============================================
   OTHELLO MOBILE WEB - HomeScreen
   Identificação do jogador com nome e avatar
   ============================================ */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Avatar } from '@/types';
import apiService from '@/services/api';
import { useSessionStore } from '@/store/sessionStore';
import { useMatchStore } from '@/stores/matchStore';
import { disconnectSocket } from '@/services/socket';
import TextField from '@/components/TextField/TextField';
import AvatarGrid from '@/components/AvatarGrid/AvatarGrid';
import PrimaryButton from '@/components/PrimaryButton/PrimaryButton';
import ToastMessage from '@/components/ToastMessage/ToastMessage';
import styles from './HomeScreen.module.scss';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { setSession, setMatchId } = useSessionStore();

  const [displayName, setDisplayName] = useState('');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [errorAvatars, setErrorAvatars] = useState('');
  const [nameError, setNameError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'info' | 'success' });

  const showToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  }, []);

  const loadAvatars = useCallback(async () => {
    try {
      setLoadingAvatars(true);
      setErrorAvatars('');
      const response = await apiService.getAvatars();
      if (response.success) {
        setAvatars(response.data);
      } else {
        setErrorAvatars(response.error?.message || 'Erro ao carregar avatares');
      }
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      setErrorAvatars(error?.error?.message || 'Erro de conexão ao carregar avatares');
    } finally {
      setLoadingAvatars(false);
    }
  }, []);

  // Load avatars on mount
  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const validate = (): boolean => {
    let valid = true;

    if (!displayName.trim()) {
      setNameError('Informe seu nome');
      valid = false;
    } else if (displayName.trim().length > 4) {
      setNameError('O nome deve ter no máximo 4 caracteres');
      valid = false;
    } else {
      setNameError('');
    }

    if (!selectedAvatar) {
      setAvatarError('Selecione um avatar');
      valid = false;
    } else {
      setAvatarError('');
    }

    return valid;
  };

  const handleReset = () => {
    disconnectSocket();
    useMatchStore.getState().reset();
    useSessionStore.getState().reset();
    setDisplayName('');
    setSelectedAvatar(null);
    setNameError('');
    setAvatarError('');
    setErrorAvatars('');
    loadAvatars();
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoadingSession(true);
      setNameError('');
      setAvatarError('');

      // 1. Create session
      const sessionResponse = await apiService.createSession(
        displayName.trim().toUpperCase(),
        selectedAvatar!.id
      );

      if (!sessionResponse.success) {
        showToast(sessionResponse.error?.message || 'Não foi possível iniciar sua sessão.');
        if (sessionResponse.error?.code === 'AVATAR_IN_USE') {
          const refreshed = await apiService.getAvatars();
          if (refreshed.success) setAvatars(refreshed.data);
        }
        return;
      }

      setSession(sessionResponse.data);

      // 2. Quick match
      const matchResponse = await apiService.quickMatch();

      if (!matchResponse.success) {
        showToast(matchResponse.error?.message || 'Erro ao entrar na fila.');
        return;
      }

      setMatchId(matchResponse.data.matchId, matchResponse.data.role);

      // 3. Navigate to waiting room
      navigate(`/waiting-room/${matchResponse.data.matchId}`);
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      showToast(error?.error?.message || 'Não foi possível iniciar sua sessão. Tente novamente.');
    } finally {
      setLoadingSession(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* Logo / Title */}
      <div className={styles.header}>
        <div className={styles.logoSection}>
          
          <h1 className={styles.title}><span className={styles.reversedR}>R</span>eversi</h1>
          <p className={styles.subtitle}>Um jogo Inteligente</p>
        </div>
        <div className={styles.divider} />
      </div>

      {/* Form */}
      <div className={styles.form}>
        <TextField
          value={displayName}
          onChange={(v) => {
            setDisplayName(v);
            if (nameError) setNameError('');
          }}
          placeholder="SEU NOME"
          maxLength={4}
          error={nameError}
          label="Nome do Jogador"
          autoFocus
        />

        <div className={styles.avatarSection}>
          <label className={styles.avatarLabel}>Selecione seu Avatar</label>
          <AvatarGrid
            avatars={avatars}
            selectedId={selectedAvatar?.id || null}
            onSelect={(avatar) => {
              setSelectedAvatar(avatar);
              if (avatarError) setAvatarError('');
            }}
            loading={loadingAvatars}
            error={errorAvatars}
          />
          {avatarError && <span className={styles.fieldError}>{avatarError}</span>}
        </div>

        <PrimaryButton
          onClick={handleSubmit}
          loading={loadingSession}
          disabled={loadingAvatars}
          variant="white"
        >
          Entrar na Sala de Espera
        </PrimaryButton>

        <button
          className={styles.resetButton}
          onClick={handleReset}
          type="button"
          disabled={loadingSession}
        >
          Resetar
        </button>
      </div>

      <ToastMessage
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
