import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Share2, ClipboardCopy } from 'lucide-react';
import { supabase } from '../supabase';
import { questions } from '../questions';

export default function CreateQuiz() {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = Intro, 1 = Quiz
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState(null);
  
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleStart = () => {
    if (!name.trim()) return alert("Please enter your name");
    setCurrentStep(1);
  };

  const handleAnswer = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentQ]: optionIdx }));
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      submitQuiz({ ...answers, [currentQ]: optionIdx });
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setIsSubmitting(true);
    try {
      let avatarUrl = '';
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      }

      const { data, error } = await supabase.from('quizzes').insert({
        user_name: name,
        user_pic_url: avatarUrl,
        answers: finalAnswers
      }).select().single();

      if (error) throw error;
      setCreatedQuizId(data.id);
    } catch (err) {
      console.error(err);
      alert("Error creating quiz!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/quiz/${createdQuizId}`;
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  if (createdQuizId) {
    return (
      <div className="glass-panel text-center">
        <h2>🎉 Quiz Created! 🎉</h2>
        <p>Your friends have 24 hours to guess your answers!</p>
        <div className="mb-8 mt-4">
          <button className="btn mb-4" onClick={copyLink}>
            <Share2 size={20} /> Copy Share Link
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/leaderboard/${createdQuizId}`)}>
            View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="glass-panel">
        <h1>How Well Do You Know Me?</h1>
        <p className="text-center">Create your 20-question quiz and challenge your friends!</p>
        
        <div className="input-group">
          <label className="input-label">Your Name</label>
          <input 
            className="input" 
            placeholder="John Doe" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label className="input-label">Profile Picture (Optional)</label>
          <label className="file-upload">
            {preview ? (
              <img src={preview} alt="Avatar" className="avatar-preview" />
            ) : (
              <Camera size={40} color="var(--primary)" className="mb-2" />
            )}
            <span>Tap to upload</span>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>

        <button className="btn mt-4" onClick={handleStart} disabled={!name.trim()}>
          Start Quiz <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="glass-panel text-center">
        <h2>Cooking up your quiz... 🍳</h2>
        <div className="loader"></div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="glass-panel">
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentQ) / questions.length) * 100}%` }}
        />
      </div>
      
      <p className="text-center mb-2" style={{color: 'var(--primary)', fontWeight: 'bold'}}>
        Question {currentQ + 1} of {questions.length}
      </p>
      
      <h2 className="text-center mb-8">{q.text}</h2>
      
      <div className="options-grid">
        {q.options.map((opt, idx) => (
          <button 
            key={idx} 
            className="option-btn"
            onClick={() => handleAnswer(idx)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
