import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '../supabase';
import { questions } from '../questions';
import MiniGame from '../components/MiniGame';
import JSConfetti from 'canvas-confetti';

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [friendName, setFriendName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // 0 = intro, 1 = answering quiz, 2 = review/game, 3 = done
  const [step, setStep] = useState(0); 
  const [currentQ, setCurrentQ] = useState(0);
  const [friendAnswers, setFriendAnswers] = useState({});
  const [feedback, setFeedback] = useState(null); // { selectedIdx, correctIdx }
  
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function fetchQuiz() {
      const { data, error } = await supabase.from('quizzes').select('*').eq('id', id).single();
      if (error || !data) {
        setError('Quiz not found or expired.');
      } else {
        setQuiz(data);
      }
      setLoading(false);
    }
    fetchQuiz();
  }, [id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const startQuiz = () => {
    if (!friendName.trim()) return alert("Enter your name to start");
    setStep(1);
  };

  const handleAnswer = (idx) => {
    if (feedback) return; // Wait for next question
    
    const correctIdx = quiz.answers[currentQ];
    const isCorrect = correctIdx === idx;
    
    if (isCorrect) {
      setScore(s => s + 1);
      JSConfetti({ particleCount: 50, spread: 30, origin: { y: 0.6 } });
    }

    setFeedback({ selectedIdx: idx, correctIdx });
    
    setTimeout(() => {
      setFeedback(null);
      if (currentQ < questions.length - 1) {
        setCurrentQ(q => q + 1);
      } else {
        setStep(2); // Move to Mini Game
      }
    }, 1500);
  };

  const handleGameEnd = async (gameScore) => {
    setLoading(true);
    let avatarUrl = '';
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from('avatars').upload(fileName, file);
      if (!uploadError) {
        const publicUrlData = supabase.storage.from('avatars').getPublicUrl(fileName).data;
        avatarUrl = publicUrlData.publicUrl;
      }
    }

    try {
      await supabase.from('quiz_submissions').insert({
        quiz_id: id,
        friend_name: friendName,
        friend_pic_url: avatarUrl,
        score,
        game_score: gameScore
      });
      navigate(`/leaderboard/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit score");
      navigate(`/leaderboard/${id}`);
    }
    setLoading(false);
  };

  if (loading) return <div className="loader"></div>;
  if (error) return <div className="glass-panel text-center"><h2>{error}</h2></div>;

  if (step === 0) {
    return (
      <div className="glass-panel text-center">
        <h1>How well do you know {quiz.user_name}?</h1>
        {quiz.user_pic_url && (
          <img src={quiz.user_pic_url} alt={quiz.user_name} className="avatar-preview mx-auto mb-4" />
        )}
        <p>Take the quiz and find out!</p>
        
        <div className="input-group text-left mt-8">
          <label className="input-label">Your Name</label>
          <input className="input" value={friendName} onChange={e => setFriendName(e.target.value)} />
        </div>
        
        <div className="input-group text-left">
          <label className="input-label">Profile Pic (Optional)</label>
          <label className="file-upload">
            {preview ? <img src={preview} className="avatar-preview" /> : <Camera color="var(--primary)" />}
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        <button className="btn mt-4" onClick={startQuiz} disabled={!friendName.trim()}>
          Start Quiz
        </button>
      </div>
    );
  }

  if (step === 1) {
    const q = questions[currentQ];
    return (
      <div className="glass-panel">
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
        </div>
        <h2 className="text-center mb-8">{q.text}</h2>
        
        <div className="options-grid">
          {q.options.map((opt, idx) => {
            let className = 'option-btn ';
            if (feedback) {
              if (idx === feedback.correctIdx) className += 'correct';
              else if (idx === feedback.selectedIdx) className += 'wrong';
            }
            
            return (
              <button 
                key={idx} 
                className={className}
                onClick={() => handleAnswer(idx)}
                disabled={!!feedback}
              >
                {opt}
                {feedback && idx === feedback.correctIdx && <Check className="inline-block ml-2" size={16} />}
                {feedback && idx === feedback.selectedIdx && idx !== feedback.correctIdx && <X className="inline-block ml-2" size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="glass-panel text-center">
        <h2>Quiz Complete! 🎉</h2>
        <p>You scored {score}/{questions.length}</p>
        <p className="mb-8">Spin the wheel to earn bonus points!</p>
        <MiniGame onComplete={handleGameEnd} />
      </div>
    );
  }

  return null;
}
