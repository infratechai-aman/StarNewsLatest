'use client'

import { useState, useEffect } from 'react'

const CricketWidget = () => {
    // Mock data for initial display (will be replaced by API later)
    // Mock match data - Simulating a "Result" state as requested when no live match is active
    const [matchData, setMatchData] = useState({
        title: 'IND vs ENG',
        status: 'Result', // Changed to Result to show "Recent Match" behavior
        team1: { name: 'IND', score: '329/10', overs: '48.2' }, // All out
        team2: { name: 'ENG', score: '330/7', overs: '49.1' }, // Won
        description: 'England won by 3 wickets'
    })

    // Simulate live updates only if status is 'Live'
    useEffect(() => {
        if (matchData.status === 'Live') {
            const interval = setInterval(() => {
                setMatchData(prev => ({
                    ...prev,
                    team1: {
                        ...prev.team1,
                        score: `${parseInt(prev.team1.score.split('/')[0]) + Math.floor(Math.random() * 2)}/${prev.team1.score.split('/')[1]}`
                    }
                }))
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [matchData.status])

    return (
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl shadow-lg p-4 mb-6 border border-blue-700/50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>

            <div className="flex justify-between items-start mb-3 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    {matchData.status === 'Live' ? 'Live Cricket' : 'Recent Match'}
                </h3>
                {matchData.status === 'Live' ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-[10px] font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-600/90 text-[10px] font-bold">
                        RESULT
                    </span>
                )}
            </div>

            <div className="flex justify-between items-center mb-2 relative z-10">
                <div className="text-center">
                    <span className="block text-xl font-bold">{matchData.team1.name}</span>
                    <span className="block text-xl font-bold text-yellow-50">{matchData.team1.score}</span>
                    <span className="block text-xs text-blue-200">{matchData.team1.overs} ov</span>
                </div>
                <div className="text-center text-blue-300 text-xs font-bold px-2">VS</div>
                <div className="text-center">
                    <span className="block text-xl font-bold opacity-100">{matchData.team2.name}</span>
                    <span className="block text-xl font-bold text-yellow-400">{matchData.team2.score}</span>
                    <span className="block text-xs text-blue-200">{matchData.team2.overs} ov</span>
                </div>
            </div>

            <p className="text-center text-xs text-blue-100 mt-3 font-medium border-t border-blue-700/50 pt-2 relative z-10">
                {matchData.description}
            </p>
        </div>
    )
}

export default CricketWidget
