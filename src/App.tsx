import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  AtSign,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  DoorOpen,
  Flower2,
  HelpCircle,
  LogOut,
  Medal,
  Menu,
  RefreshCw,
  Trophy,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { getGlobalScores, saveScore, useBestScore, type GlobalScore } from '@/lib/scores';
import { buildDoorRounds, type Round } from '@/lib/riddles';
import { playCorrect, playDoorOpen, playLocked, playWrong, unlockAudio } from '@/lib/sfx';

const DOOR_COUNT = 5;
const POINTS_PER_DOOR = 50;
const POINTS_WRONG = 10;
const TIME_BONUS_PER_SECOND = 5;
const MAZE = [
  '###########################',
  '#...........#.............#',
  '#.###.###.#.#.#####.#####.#',
  '#.........#...#...#.....#.#',
  '###...#########.#.#...###.#',
  '#.......#...#...#.....#...#',
  '#.###.#.#.#.#.#.#####.#.#.#',
  '#.#...#.....#.#.#.....#.#.#',
  '#.###.###...#.#.#.#####.#.#',
  '#...#.......#.#.#.........#',
  '###.#####.#.###.#########.#',
  '#...#.#...#.............#.#',
  '#.###.#.#####...#####.###.#',
  '#.#.....#...#.....#.......#',
  '#.#######.#.#.###.#.#...###',
  '#.....#...#.....#.#.#...#.#',
  '#####.#.#######.#.#.#.###.#',
  '#...#.........#...#.#.#...#',
  '###.#...#####.#.###.#.###.#',
  '#...#.......#.#...#.#.....#',
  '#.#.#.#######.###.#.#...###',
  '#.#.#.#...#...#...#.#.....#',
  '#.###.#.#.#.###.###.#.###.#',
  '#...........#.....#......X#',
  '###########################',
];
const START = { row: 1, col: 1 };
const EXIT = { row: 23, col: 25 };
const DOORS = [
  { row: 1, col: 8, label: 'SIP-1' },
  { row: 12, col: 5, label: 'SIP-2' },
  { row: 11, col: 20, label: 'SIP-3' },
  { row: 3, col: 22, label: 'SIP-4' },
  { row: 19, col: 10, label: 'SIP-5' },
];

type Phase = 'hub' | 'playing' | 'finished';
type Overlay = 'none' | 'menu' | 'question' | 'wrong' | 'correct' | 'locked' | 'all-doors';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} second${s === 1 ? '' : 's'}`;
  return `${m} min ${s.toString().padStart(2, '0')} sec`;
}

function StandXLogo({ className = '' }: { className?: string }) {
  return <img src="/images/standx-logo.png" alt="StandX" className={`standx-logo ${className}`} />;
}

function TitleBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`title-block ${compact ? 'title-block-compact' : ''}`}>
      <StandXLogo className="title-logo" />
      <div>
        <div className="title-main">
          STANDX <span className="title-accent">LABYRINTH</span>
        </div>
        {!compact && <p className="title-tagline">Learn the SIPs, Escape the Labyrinth!</p>}
      </div>
    </div>
  );
}

function Mascot({
  size = 'md',
  mood = 'idle',
}: {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'idle' | 'sad' | 'happy';
}) {
  return (
    <div className={`mascot-scene mascot-scene-${size}`}>
      <div className={`mascot mascot-${size} mascot-${mood}`} role="img" aria-label="StandX mascot">
        <div className="mascot-highlight" />
        <div className="mascot-stalk" />
        <div className="mascot-leaf" />
        <div className="mascot-arm mascot-arm-left"><span className="mascot-hand" /></div>
        <div className="mascot-arm mascot-arm-right"><span className="mascot-hand" /></div>
        <div className="mascot-eye">
          <span className="mascot-iris" />
          <i className="mascot-glint mascot-glint-a" />
          <i className="mascot-glint mascot-glint-b" />
        </div>
        <div className="mascot-mouth" />
        <div className="mascot-leg mascot-leg-left"><span className="mascot-foot" /></div>
        <div className="mascot-leg mascot-leg-right"><span className="mascot-foot" /></div>
        {mood === 'happy' && <div className="mascot-flower" />}
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading, signInWithUsername, signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>('hub');
  const [showSignIn, setShowSignIn] = useState(true);
  const [lastRun, setLastRun] = useState<{ score: number; seconds: number } | null>(null);

  useEffect(() => {
    const arm = () => unlockAudio();
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

  if (loading) {
    return (
      <div className="app-shell center-screen">
        <Mascot size="lg" />
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!user || showSignIn) {
    return (
      <SignInScreen
        onSignIn={async (username) => {
          const error = await signInWithUsername(username);
          if (!error) setShowSignIn(false);
          return error;
        }}
        signedIn={!!user}
        onContinue={() => setShowSignIn(false)}
      />
    );
  }

  if (phase === 'playing') {
    return (
      <GameScreen
        userId={user.id}
        username={user.user_metadata.user_name}
        onQuit={() => setPhase('hub')}
        onFinish={(result) => {
          setLastRun(result);
          setPhase('finished');
        }}
      />
    );
  }

  if (phase === 'finished') {
    return (
      <FinishedScreen
        userId={user.id}
        lastRun={lastRun}
        onMenu={() => setPhase('hub')}
        onPlayAgain={() => setPhase('playing')}
      />
    );
  }

  return (
    <HubScreen
      userName={user.user_metadata.user_name}
      userId={user.id}
      onStart={() => setPhase('playing')}
      onSignOut={signOut}
      onSwitchAccount={() => setShowSignIn(true)}
    />
  );
}

function SignInScreen({
  onSignIn,
  signedIn,
  onContinue,
}: {
  onSignIn: (username: string) => Promise<string | null>;
  signedIn: boolean;
  onContinue: () => void;
}) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(await onSignIn(username));
    setSubmitting(false);
  };

  return (
    <div className="app-shell center-screen signin-screen">
      <div className="signin-card">
        <TitleBlock />
        <p className="signin-copy">Pick a username to save your score on the leaderboard.</p>
        <form onSubmit={handleSubmit} className="signin-form">
          <label htmlFor="username">Username</label>
          <div className="signin-input-wrap">
            <AtSign className="signin-icon" />
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your_name"
              maxLength={15}
              autoComplete="username"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Signing in...' : signedIn ? 'Switch account' : 'Enter the maze'}
          </button>
          {signedIn && (
            <button type="button" className="btn-ghost" onClick={onContinue}>
              Continue with current account
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function HubScreen({
  userName,
  userId,
  onStart,
  onSignOut,
  onSwitchAccount,
}: {
  userName: string;
  userId: string;
  onStart: () => void;
  onSignOut: () => void;
  onSwitchAccount: () => void;
}) {
  const { best, runs, loading } = useBestScore(userId);

  return (
    <div className="app-shell hub-screen">
      <header className="hub-header">
        <TitleBlock compact />
        <div className="hub-user">
          <span>@{userName}</span>
          <button type="button" onClick={onSwitchAccount} aria-label="Switch account">
            <AtSign className="icon-sm" />
          </button>
          <button type="button" onClick={onSignOut} aria-label="Sign out">
            <LogOut className="icon-sm" />
          </button>
        </div>
      </header>

      <div className="hub-grid">
        <section className="panel howto-panel">
          <TitleBlock />
          <h2>How to Play</h2>
          <ul>
            <li>
              <span className="howto-icon howto-door"><DoorOpen className="icon-sm" /></span>
              Find SIP doors in order: SIP-1, then SIP-2, then SIP-3, SIP-4, and SIP-5.
            </li>
            <li>
              <span className="howto-icon howto-ok"><Check className="icon-sm" /></span>
              Answer the question correctly to open that door.
            </li>
            <li>
              <span className="howto-icon howto-bad"><X className="icon-sm" /></span>
              A wrong answer costs 10 points. You stay at that door and try again.
            </li>
            <li>
              <span className="howto-icon howto-win"><Trophy className="icon-sm" /></span>
              Open every door, then reach the glowing EXIT flower. Your finish time is shown at the end.
            </li>
          </ul>

          <h3>Controls</h3>
          <div className="control-keys">
            <span>W</span><span>A</span><span>S</span><span>D</span>
            <span className="control-or">or arrow keys</span>
          </div>
          <p className="control-note">Mobile: use the on-screen joystick.</p>

          <div className="stander-card">
            <Mascot size="md" />
            <div>
              <p className="stander-name">STANDER</p>
              <p>StandX mascot. Guide it through the stone maze and learn every SIP.</p>
            </div>
          </div>

          <div className="hub-stats">
            <div><strong>{loading ? '—' : best ?? 0}</strong><span>Best score</span></div>
            <div><strong>{loading ? '—' : runs ?? 0}</strong><span>Runs</span></div>
          </div>

          <div className="hub-footer-icons">
            <span><DoorOpen className="icon-sm" /> 5 SIP Doors</span>
            <span><HelpCircle className="icon-sm" /> 5 Questions</span>
            <span><Flower2 className="icon-sm" /> 1 Exit</span>
          </div>

          <button type="button" className="btn-primary btn-start" onClick={onStart}>
            Start Game
          </button>
        </section>

        <section className="panel preview-panel">
          <div className="preview-frame">
            <MiniMazePreview />
          </div>
          <Leaderboard />
        </section>
      </div>
    </div>
  );
}

function MiniMazePreview() {
  return (
    <div className="mini-maze">
      {MAZE.slice(0, 12).map((row, rowIndex) => (
        <div key={rowIndex} className="mini-maze-row" style={{ gridTemplateColumns: `repeat(${MAZE[0].length}, 1fr)` }}>
          {[...row].map((cell, colIndex) => (
            <div key={colIndex} className={`mini-cell ${cell === '#' ? 'mini-wall' : 'mini-floor'}`} />
          ))}
        </div>
      ))}
      <div className="mini-mascot"><Mascot size="sm" /></div>
    </div>
  );
}

function Leaderboard() {
  const [scores, setScores] = useState<GlobalScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadScores = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setScores(await getGlobalScores());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadScores();
  }, []);

  return (
    <section className="leaderboard">
      <div className="leaderboard-head">
        <div><Medal className="icon-sm" /> Leaderboard</div>
        <button type="button" onClick={() => void loadScores()} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`icon-sm ${loading ? 'spin' : ''}`} />
        </button>
      </div>
      {loading ? (
        <p className="leaderboard-empty">Loading rankings...</p>
      ) : failed ? (
        <p className="leaderboard-empty error">Could not load rankings.</p>
      ) : scores.length === 0 ? (
        <p className="leaderboard-empty">Be the first on the board.</p>
      ) : (
        <div className="leaderboard-list">
          {scores.map((entry, index) => (
            <div key={entry.id} className="leaderboard-row">
              <span className={`rank ${index < 3 ? 'rank-top' : ''}`}>{index + 1}</span>
              <span className="name">@{entry.x_username}</span>
              <span className="score">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function GameScreen({
  userId,
  username,
  onQuit,
  onFinish,
}: {
  userId: string;
  username: string;
  onQuit: () => void;
  onFinish: (result: { score: number; seconds: number }) => void;
}) {
  const rounds = useMemo(() => buildDoorRounds(DOOR_COUNT), []);
  const [position, setPosition] = useState(START);
  const [openedDoors, setOpenedDoors] = useState<number[]>([]);
  const [pendingDoor, setPendingDoor] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [exitUnlocked, setExitUnlocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [runScore, setRunScore] = useState(0);
  const [scorePulse, setScorePulse] = useState<'none' | 'loss' | 'gain'>('none');
  const startTimeRef = useRef(Date.now());
  const savedRun = useRef(false);

  const nextDoorIndex = openedDoors.length;
  const nextDoorLabel = DOORS[nextDoorIndex]?.label ?? 'EXIT';
  const blocked = overlay === 'question' || overlay === 'wrong' || overlay === 'correct' || overlay === 'menu' || overlay === 'locked';

  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000)),
      250,
    );
    return () => window.clearInterval(timer);
  }, []);

  const finishRun = useCallback(async () => {
    if (savedRun.current) return;
    savedRun.current = true;
    const timeBonus = Math.max(0, 180 - seconds) * TIME_BONUS_PER_SECOND;
    const totalScore = Math.max(0, runScore + timeBonus);
    try {
      await saveScore(
        { score: totalScore, doors_opened: openedDoors.length, completion_time_seconds: seconds },
        userId,
        username,
      );
    } catch {
      // Still show completion if network fails briefly.
    }
    onFinish({ score: totalScore, seconds });
  }, [onFinish, openedDoors.length, runScore, seconds, userId, username]);

  const move = useCallback(
    (rowDelta: number, colDelta: number) => {
      if (blocked) return;
      const next = { row: position.row + rowDelta, col: position.col + colDelta };
      const cell = MAZE[next.row]?.[next.col];
      if (!cell || cell === '#') return;

      const doorIndex = DOORS.findIndex((door) => door.row === next.row && door.col === next.col);
      if (doorIndex >= 0 && !openedDoors.includes(doorIndex)) {
        if (doorIndex !== nextDoorIndex) {
          playLocked();
          setOverlay('locked');
          return;
        }
        setPosition(next);
        setPendingDoor(doorIndex);
        setOverlay('question');
        return;
      }

      setPosition(next);
      if ((cell === 'X' || (next.row === EXIT.row && next.col === EXIT.col)) && exitUnlocked) {
        void finishRun();
      }
    },
    [blocked, exitUnlocked, finishRun, nextDoorIndex, openedDoors, position.col, position.row],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const controls: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        w: [-1, 0],
        W: [-1, 0],
        ArrowDown: [1, 0],
        s: [1, 0],
        S: [1, 0],
        ArrowLeft: [0, -1],
        a: [0, -1],
        A: [0, -1],
        ArrowRight: [0, 1],
        d: [0, 1],
        D: [0, 1],
      };
      const direction = controls[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction[0], direction[1]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  const answerDoor = (answerIndex: number) => {
    if (pendingDoor === null) return;
    const round = rounds[pendingDoor];
    if (answerIndex !== round.answerIndex) {
      playWrong();
      setRunScore((score) => Math.max(0, score - POINTS_WRONG));
      setScorePulse('loss');
      window.setTimeout(() => setScorePulse('none'), 480);
      setOverlay('wrong');
      return;
    }

    const doorIndex = pendingDoor;
    setOpenedDoors((doors) => [...doors, doorIndex]);
    setRunScore((score) => score + POINTS_PER_DOOR);
    setScorePulse('gain');
    window.setTimeout(() => setScorePulse('none'), 480);
    setPendingDoor(null);
    playCorrect();
    window.setTimeout(() => playDoorOpen(), 180);
    setOverlay('correct');
  };

  const currentRound = pendingDoor === null ? null : rounds[pendingDoor];

  return (
    <div className="game-shell">
      <header className="game-topbar">
        <button type="button" className="icon-btn" onClick={() => setOverlay('menu')} aria-label="Menu">
          <Menu className="icon-sm" />
        </button>
        <TitleBlock compact />
        <div className={`score-pill ${scorePulse === 'loss' ? 'score-pill-loss' : ''} ${scorePulse === 'gain' ? 'score-pill-gain' : ''}`}>
          <Trophy className="icon-sm" />
          <span>{runScore}</span>
        </div>
      </header>

      <div className="game-subbar">
        <div className="game-timer"><Clock className="icon-sm" /> {formatTime(seconds)}</div>
        <div className="target-door">{nextDoorLabel}</div>
        <div>{openedDoors.length}/{DOOR_COUNT}</div>
      </div>

      <div className="game-stage">
        <div className="maze-scene">
        <div
          className="maze-board"
          style={{ gridTemplateColumns: `repeat(${MAZE[0].length}, minmax(0, 1fr))` }}
        >
          {MAZE.flatMap((row, rowIndex) =>
            [...row].map((cell, colIndex) => {
              const doorIndex = DOORS.findIndex((door) => door.row === rowIndex && door.col === colIndex);
              const isPlayer = position.row === rowIndex && position.col === colIndex;
              const isExit = cell === 'X';
              const opened = doorIndex >= 0 && doorIndex < nextDoorIndex;
              const locked = doorIndex > nextDoorIndex;
              const current = doorIndex === nextDoorIndex;
              const floorVariant = (colIndex + rowIndex * 3) % 4;
              const wallVariant = (colIndex * 2 + rowIndex) % 3;
              const decor = cell !== '#' && doorIndex < 0 && !isExit ? (colIndex * 17 + rowIndex * 31) % 19 : -1;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`maze-cell ${cell === '#' ? `maze-wall maze-wall-${wallVariant}` : `maze-floor maze-floor-${floorVariant}`} ${isExit ? 'maze-exit' : ''}`}
                >
                  {cell === '#' && (
                    <>
                      <span className="wall-top" />
                      <span className="wall-front" />
                      <span className="wall-side" />
                      {wallVariant === 0 && <span className="wall-lichen" />}
                      {wallVariant === 2 && <span className="wall-crack" />}
                    </>
                  )}
                  {decor === 0 && <span className="maze-bush" />}
                  {decor === 3 && <span className="maze-moss" />}
                  {decor === 5 && <span className="maze-rock" />}
                  {decor === 7 && <span className="maze-torch" />}
                  {decor === 10 && <span className="maze-puddle" />}
                  {decor === 13 && <span className="maze-vine" />}
                  {decor === 16 && <span className="maze-rune" />}
                  {doorIndex >= 0 && <DoorTile label={DOORS[doorIndex].label} opened={opened} locked={locked} current={current} />}
                  {isExit && (
                    <div className={`exit-gate ${exitUnlocked ? 'exit-open' : 'exit-locked'}`}>
                      <Flower2 className="icon-sm" />
                      <span>EXIT</span>
                    </div>
                  )}
                  {isPlayer && (
                    <div className="maze-player">
                      <Mascot size="sm" mood="idle" />
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>
        </div>

        <div className="touch-controls">
          <DirectionPad onMove={move} disabled={blocked} />
          <button type="button" className="action-btn" disabled={blocked} aria-label="Action">
            <StandXLogo className="action-logo" />
          </button>
        </div>
      </div>

      {overlay === 'menu' && (
        <ModalShell onClose={() => setOverlay('none')}>
          <div className="menu-modal">
            <TitleBlock />
            <button type="button" className="btn-primary" onClick={() => setOverlay('none')}>Resume</button>
            <button type="button" className="btn-ghost" onClick={onQuit}>Quit to hub</button>
          </div>
        </ModalShell>
      )}

      {overlay === 'question' && pendingDoor !== null && currentRound && (
        <QuestionModal
          door={DOORS[pendingDoor].label}
          round={currentRound}
          onAnswer={answerDoor}
        />
      )}

      {overlay === 'locked' && (
        <FeedbackModal
          tone="wrong"
          title="LOCKED"
          body={`Open ${nextDoorLabel} first. Doors must be cleared in order.`}
          buttonLabel="OK"
          onClose={() => setOverlay('none')}
        />
      )}

      {overlay === 'wrong' && (
        <FeedbackModal
          tone="wrong"
          title="WRONG!"
          body="Stay at this door and try again."
          bonus={`-${POINTS_WRONG} POINTS`}
          buttonLabel="OK"
          onClose={() => setOverlay(pendingDoor !== null ? 'question' : 'none')}
        />
      )}

      {overlay === 'correct' && (
        <FeedbackModal
          tone="success"
          title="CORRECT!"
          body="Door opened. Keep going."
          bonus={`+${POINTS_PER_DOOR} POINTS`}
          buttonLabel="CONTINUE"
          onClose={() => setOverlay(openedDoors.length === DOOR_COUNT ? 'all-doors' : 'none')}
        />
      )}

      {overlay === 'all-doors' && (
        <FeedbackModal
          tone="success"
          title="COMPLETED!"
          subtitle="CONGRATULATIONS!"
          body="You passed all SIP doors!"
          bonus={`+${DOOR_COUNT * POINTS_PER_DOOR} POINTS`}
          buttonLabel="GO TO EXIT"
          onClose={() => {
            setExitUnlocked(true);
            setOverlay('none');
          }}
        />
      )}
    </div>
  );
}

function DoorTile({
  label,
  opened,
  locked,
  current,
}: {
  label: string;
  opened: boolean;
  locked: boolean;
  current: boolean;
}) {
  return (
    <div className={`maze-door ${opened ? 'maze-door-open' : ''} ${locked ? 'maze-door-locked' : ''} ${current ? 'maze-door-current' : ''}`}>
      <span className="door-tag">{label}</span>
      <div className="door-frame">
        <div className="door-light" />
        <div className="door-panel">
          <span className="door-plank" />
          <span className="door-handle" />
        </div>
      </div>
    </div>
  );
}

function DirectionPad({ onMove, disabled }: { onMove: (row: number, col: number) => void; disabled: boolean }) {
  const btn = 'dpad-btn';
  return (
    <div className="dpad">
      <div />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(-1, 0)} aria-label="Up">
        <ChevronUp />
      </button>
      <div />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(0, -1)} aria-label="Left">
        <ChevronLeft />
      </button>
      <div className="dpad-center" />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(0, 1)} aria-label="Right">
        <ChevronRight />
      </button>
      <div />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(1, 0)} aria-label="Down">
        <ChevronDown />
      </button>
      <div />
    </div>
  );
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal-card">{children}</div>
    </div>
  );
}

function QuestionModal({
  door,
  round,
  onAnswer,
}: {
  door: string;
  round: Round;
  onAnswer: (index: number) => void;
}) {
  const labels = ['A', 'B', 'C', 'D'];
  return (
    <ModalShell>
      <div className="question-modal">
        <h3>{door} QUESTION</h3>
        <p>{round.prompt}</p>
        <div className="answer-list">
          {round.options.map((option, index) => (
            <button key={index} type="button" className="answer-btn" onClick={() => onAnswer(index)}>
              <span>{labels[index]}</span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function FeedbackModal({
  tone,
  title,
  subtitle,
  body,
  bonus,
  buttonLabel,
  onClose,
}: {
  tone: 'wrong' | 'success';
  title: string;
  subtitle?: string;
  body: string;
  bonus?: string;
  buttonLabel: string;
  onClose: () => void;
}) {
  return (
    <ModalShell>
      <div className={`feedback-modal feedback-${tone}`}>
        <Mascot size="md" mood={tone === 'wrong' ? 'sad' : 'happy'} />
        {subtitle && <p className="feedback-subtitle">{subtitle}</p>}
        <h3>{title}</h3>
        <p>{body}</p>
        {bonus && <p className="feedback-bonus">{bonus}</p>}
        <button type="button" className="btn-primary" onClick={onClose}>{buttonLabel}</button>
      </div>
    </ModalShell>
  );
}

function FinishedScreen({
  userId,
  lastRun,
  onMenu,
  onPlayAgain,
}: {
  userId: string;
  lastRun: { score: number; seconds: number } | null;
  onMenu: () => void;
  onPlayAgain: () => void;
}) {
  const { best, loading } = useBestScore(userId);

  return (
    <div className="app-shell center-screen finished-screen">
      <div className="finished-card">
        <StandXLogo className="finished-logo" />
        <Mascot size="lg" mood="happy" />
        <p className="feedback-subtitle">CONGRATULATIONS!</p>
        <h2>Run Complete</h2>
        <p>Your score has been saved.</p>
        {lastRun && (
          <div className="finished-time">
            <Clock className="icon-sm" />
            <div>
              Finished in <strong>{formatDuration(lastRun.seconds)}</strong>
              <span>{formatTime(lastRun.seconds)}</span>
            </div>
          </div>
        )}
        <div className="finished-score">
          <span>This run</span>
          <strong>{lastRun ? lastRun.score.toLocaleString() : '—'}</strong>
        </div>
        <div className="finished-score">
          <span>Best score</span>
          <strong>{loading ? '—' : best ?? 0}</strong>
        </div>
        <div className="finished-actions">
          <button type="button" className="btn-primary" onClick={onPlayAgain}>Play again</button>
          <button type="button" className="btn-ghost" onClick={onMenu}>Back to hub</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
