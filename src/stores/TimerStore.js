import { defineStore } from 'pinia'
import { calculateBestMon, calculateMean, calculateAvg, calculateBestAon, formatTime } from '@/helpers/timer.js'

export const session_types = [
	{ name: '3x3 Blindfolded', id: 0 },
	{ name: '3x3 Edges', id: 1 },
	{ name: '3x3 Corners', id: 2 },
]
export const solve_statuses = [
	{label: "Success", value: 0},
	{label: "DNF", value: 1},
	{label: "+2", value: 2},
]

export const useTimerStore = defineStore('timerStore', {
	state: () => {
		return {
			sessions: [],
		}
	},
	actions: {
		getNewSessionID() {
			//Unique ID so sessions can have the same name
			const existingIDs = new Set(this.sessions.map((s) => s.id))
			let newID = 1
			while (existingIDs.has(newID)) {
				newID++
			}
			return newID
		},

		newSession() {
			//Creates a default, empty session
			const newID = this.getNewSessionID()
			this.sessions.push({
				name: 'Untitled',
				id: newID,
				type: 0,
				solves: [],
			})

			this.saveState()
			this.loadState()

			return newID
		},
		deleteSession(id) {
			//Deletes the session at its index in the array of sessions, then saves
			this.sessions.splice(this.getSessionIndexWithID(id), 1)
			this.saveState()
			this.loadState()
		},
		isValidSessionID(id) {
			for (var i = 0; i < this.sessions.length; i++) {
				if (this.sessions[i].id === id) return true
			}
			return false
		},
		getSessionIndexWithID(id) {
			for (var i = 0; i < this.sessions.length; i++) {
				if (this.sessions[i].id === id) return i
			}
			return -1
		},

		getSession(id) {
			for (var i = 0; i < this.sessions.length; i++) {
				if (this.sessions[i].id === id) return this.sessions[i]
			}
			return null
		},
		getName(id) {
			for (var i = 0; i < this.sessions.length; i++) {
				if (this.sessions[i].id === id) return this.sessions[i].name
			}
			return ''
		},
		addSolve(sessionID, solve) {
			this.getSession(sessionID).solves.push(solve)
			this.saveState();
		},
		deleteSolve(sessionID, solveIndex) {
			this.sessions[this.getSessionIndexWithID(sessionID)].solves.splice(solveIndex, 1)
			this.saveState();
		},

		getDnfCount(sessionID) {
			let dnfs = 0
			for (const solve of this.getSession(sessionID).solves) {
				if (solve[2] == 1)
					dnfs++
			}
			return dnfs
		},

		moN(sessionID, section, n) { //Mean of N
			if (this.getSession(sessionID).solves.length < n)
				return [-1, true]
			const solves = this.getSession(sessionID).solves.slice(-n) //Latest n solves
			return calculateMean(solves, section)
		},
		aoN(sessionID, section, n) { //Average of N
			if (this.getSession(sessionID).solves.length < n)
				return [-1, true]
			const solves = this.getSession(sessionID).solves.slice(-n) //Latest n solves
			return calculateAvg(solves, section)
		},

		getSessionStatistics(id, section) {
			const solves = this.getSession(id).solves
			const out = [
				["time",    this.moN(id, section, 1)  , calculateBestMon(solves, section, 1)],
				["mo3",     this.moN(id, section, 3)  , calculateBestMon(solves, section, 3)],
				["ao5",     this.aoN(id, section, 5)  , calculateBestAon(solves, section, 5)],
				["ao12",    this.aoN(id, section, 12) , calculateBestAon(solves, section, 12)],
				["ao25",    this.aoN(id, section, 25) , calculateBestAon(solves, section, 25)],
				["ao50",    this.aoN(id, section, 50) , calculateBestAon(solves, section, 50)],
				["ao100",   this.aoN(id, section, 100), calculateBestAon(solves, section, 100)],
			]
			return out
		},

		saveState() {
			localStorage.setItem(
				'timerStore',
				JSON.stringify({
					sessions: this.sessions,
				}),
			)
		},
		loadState() {
			var data = JSON.parse(localStorage.getItem('timerStore')) || {}
			this.sessions = data.sessions || []

			// Debug: Generate a bunch of random solves
			if (false) {
				this.sessions[6].solves = []
				for (var i = 0; i < 2000; i++) {
					const randomSolve = [Math.floor(Math.random() * 10000) + 10000, Math.floor(Math.random() * 10000), Math.random() < 0.1 ? 2 : (Math.random() < 0.9 ? 0 : 1), "R U R\' U\'"]
					this.sessions[6].solves.push(randomSolve)
				}
				this.saveState()
			}
		},
	},
	getters: {
		getSessionNames: (state) => state.sessions.map((session) => session.name),
	},
})
