const fs = require('fs');
const path = require('path');

class PeriodEngine {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.data = this.loadData();
    }

    loadData() {
        if (!fs.existsSync(this.dataPath)) {
            return { cycles: [], symptoms: [] };
        }
        return JSON.parse(fs.readFileSync(this.dataPath));
    }

    save() {
        fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    }

    addPeriod(startDate, duration = 5) {
        this.data.cycles.push({
            id: Date.now(),
            start: startDate,
            duration: parseInt(duration) || 5
        });
        this.save();
    }

    addSymptom(date, symptoms) {
        if (!this.data.symptoms) this.data.symptoms = [];
        this.data.symptoms.push({
            date,
            ...symptoms
        });
        this.save();
    }

    getDailyInsights(currentDate) {
        const symptoms = this.data.symptoms?.filter(s => s.date === currentDate) || [];
        return symptoms;
    }

    predictNext() {
        if (this.data.cycles.length < 2) return null;
        
        // Calculate average cycle length
        let totalDays = 0;
        for (let i = 1; i < this.data.cycles.length; i++) {
            const d1 = new Date(this.data.cycles[i-1].start);
            const d2 = new Date(this.data.cycles[i].start);
            totalDays += (d2 - d1) / (1000 * 60 * 60 * 24);
        }
        const avgLength = totalDays / (this.data.cycles.length - 1);
        
        const lastPeriod = new Date(this.data.cycles[this.data.cycles.length - 1].start);
        const nextDate = new Date(lastPeriod);
        nextDate.setDate(lastPeriod.getDate() + Math.round(avgLength));
        
        return nextDate.toISOString().split('T')[0];
    }

    getPhase(currentDate) {
        const last = new Date(this.data.cycles[this.data.cycles.length - 1]?.start);
        if (!last || isNaN(last.getTime())) return 'Welcome to Aura';

        const diffTime = new Date(currentDate) - last;
        const dayOfCycle = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (dayOfCycle < 1) return 'Cycle starting soon';
        if (dayOfCycle <= 5) return 'Menstrual (Rest & Reflect)';
        if (dayOfCycle <= 13) return 'Follicular (Set Intentions)';
        if (dayOfCycle <= 15) return 'Ovulatory (Peak Energy)';
        if (dayOfCycle <= 32) return 'Luteal (Turn Inward)';
        return 'Late (Check logs)';
    }
}

module.exports = PeriodEngine;
