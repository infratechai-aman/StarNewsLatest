'use client'

import { useState, useEffect } from 'react'

const CricketWidget = () => {
    // Mock data for initial display (will be replaced by API later)
    const [matchData, setMatchData] = useState({
        title: 'IND vs AUS', // Match Title
        status: 'Live', // Live, Completed, Upcoming
        team1: { name: 'IND', score: '245/3', overs: '42.1' },
        team2: { name: 'AUS', score: 'Target: 310', overs: '' },
        description: 'India needs 65 runs in 47 balls'
    })

    // Simulate live updates (for demo feel)
    useEffect(() => {
        const interval = setInterval(() => {
            // Toggle runs slightly to make it feel alive
            setMatchData(prev => ({
                ...prev,
                team1: {
                    ...prev.team1,
                    score: `${parseInt(prev.team1.score.split('/')[0]) + Math.floor(Math.random() * 2)}/${prev.team1.score.split('/')[1]}`
                }
            }))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl shadow-lg p-4 mb-6 border border-blue-700/50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>

            <div className="flex justify-between items-start mb-3 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-200">Live Cricket</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                </span>
            </div>

            <div className="flex justify-between items-center mb-2 relative z-10">
                <div className="text-center">
                    <span className="block text-xl font-bold">{matchData.team1.name}</span>
                    <span className="block text-2xl font-black text-yellow-400">{matchData.team1.score}</span>
                    <span className="block text-xs text-blue-200">{matchData.team1.overs} ov</span>
                </div>
                <div className="text-center text-blue-300 text-xs font-bold">VS</div>
                <div className="text-center">
                    <span className="block text-xl font-bold opacity-75">{matchData.team2.name}</span>
                    <span className="block text-lg font-bold">{matchData.team2.score}</span>
                </div>
            </div>

            <p className="text-center text-xs text-blue-100 mt-2 font-medium border-t border-blue-700/50 pt-2 relative z-10">
                {matchData.description}
            </p>
        </div>
    )
}

export default CricketWidget
