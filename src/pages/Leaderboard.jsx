import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Home } from 'lucide-react';
import { supabase } from '../supabase';

export default function Leaderboard() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: qData }, { data: sData }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', id).single(),
        supabase.from('quiz_submissions').select('*').eq('quiz_id', id).order('total_score', { ascending: false })
      ]);

      if (qData) setQuiz(qData);
      if (sData) setSubmissions(sData);
      setLoading(false);
    }
    
    fetchData();

    // Subscribe to new submissions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_submissions', filter: `quiz_id=eq.${id}` },
        (payload) => {
          setSubmissions(prev => {
            const next = [...prev, payload.new];
            return next.sort((a, b) => b.total_score - a.total_score);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return <div className="loader"></div>;
  if (!quiz) return <div className="glass-panel text-center"><h2>Quiz not found 😢</h2></div>;

  return (
    <div className="glass-panel">
      <h1 className="text-center">Leaderboard</h1>
      <p className="text-center mb-8">Who knows {quiz.user_name} the best?</p>

      {submissions.length === 0 ? (
        <p className="text-center mb-8 text-muted">No one has taken this quiz yet!</p>
      ) : (
        <div className="leaderboard-list mb-8">
          {submissions.map((sub, idx) => (
            <div key={sub.id} className="leaderboard-item">
              <span className="leaderboard-rank">#{idx + 1}</span>
              <div className="leaderboard-user">
                {sub.friend_pic_url ? (
                  <img src={sub.friend_pic_url} alt={sub.friend_name} className="avatar-sm" />
                ) : (
                  <div className="avatar-sm" style={{background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>
                    {sub.friend_name[0].toUpperCase()}
                  </div>
                )}
                <span>{sub.friend_name}</span>
              </div>
              <div className="text-right">
                <div className="leaderboard-score">{sub.total_score} pts</div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                  ({sub.score} + {sub.game_score} game)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
        <button className="btn mb-4" onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/quiz/${id}`);
          alert('Link copied!');
        }}>
          <Share2 size={20} /> Copy Share Link
        </button>
        <Link to="/" className="btn btn-secondary text-center" style={{textDecoration: 'none'}}>
          <Home size={20} className="mr-2" style={{marginRight: '8px'}} /> Create Your Own Quiz
        </Link>
      </div>
    </div>
  );
}
