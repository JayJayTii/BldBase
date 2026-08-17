

// Adds up all times in a set of solves, ignoring any DNFs.
// This can also be done for each "section" of the solve, which is either the full solve, the memo part, or the exec part.
export function getSumOfTimes(solves, section) {
	const plus2count = solves.reduce((count, solve) => count + (solve[2] == 2 ? 1 : 0), 0)
	let sumTime = 0
	switch (section) {
		case 0: //Memo AND exec
			sumTime = solves.reduce((sum, solve) => sum + solve[0], 0)
			sumTime += 2000 * plus2count
			break
		case 1: //Memo
			sumTime = solves.reduce((sum, solve) => sum + solve[1], 0)
			break
		case 2: //Exec
			sumTime = solves.reduce((sum, solve) => sum + (solve[0] - solve[1]), 0)
			break
	}
	return sumTime
}

// Converts an array of solves, which have all their data like scrambles and times for each section, into just the time that is of interest.
export function getSolveTimes(solves, section){
	switch (section) {
		case 0: //Memo AND exec
			return solves.map(solve => solve[0] + (solve[2] == 2 ? 2000 : 0))
		case 1: //Memo
			return solves.map(solve => solve[1])
		case 2: //Exec
			return solves.map(solve => solve[0] - solve[1])
	}
}

// This function calculates the mean of a certain number of solves,
// taking into account which section of the solve to average (memo, exec, or the whole thing)
// and each solve's penalty status
export function calculateMean(solves, section) {
	let timeSum = 0
	const simpleSolves = solves.map(solve => getSimplifiedSolve(solve, section))
	let dnfs = 0
	for (var i = 0; i < solves.length; i++) {
		timeSum += simpleSolves[i][0]

		if (simpleSolves[i][1])
			dnfs++
	}
	const mean = timeSum / solves.length
	const dnf = (section == 0 && dnfs > 0)
	return [mean, dnf]
}

// Convert the solve into just [time, isDnf]
export function getSimplifiedSolve(solve, section) {
	if (section == 0)
		return [solve[0] + (solve[2] == 2 ? 2000 : 0), solve[2] == 1] // Fold +2s into the time
	else if (section == 1)
		return [solve[1], false]
	else
		return [solve[0] - solve[1], false]
}

// This finds the best mean of n solves in a whole session for each section of the solve
// Expects solves in the simplified format for the sake of optimisation
export function calculateBestMon(simplifiedSolves, section, n) {
	if (simplifiedSolves.length < n)
		return -1

	//console.time("calculating mo" + n.toString())
	const queue = Array.from({ length: n }, n => [0, false])
	let rollingSum = 0;
	let rollingDnfCount = 0
	for (var i = 0; i < n; i++) {
		queue[i] = simplifiedSolves[i]
		rollingSum += simplifiedSolves[i][0]
		if (simplifiedSolves[i][1])
			rollingDnfCount++
	}

	let best = (section == 0 && rollingDnfCount > 0) ? -1 : (rollingSum / n)

	for (var i = n; i < simplifiedSolves.length; i++) {
		if (queue[i % n][1]) rollingDnfCount--
		rollingSum -= queue[i % n][0]

		queue[i % n] = simplifiedSolves[i]

		rollingSum += queue[i % n][0]
		if (queue[i % n][1]) rollingDnfCount++

		if (rollingDnfCount > 0 && section == 0)
			continue

		const mean = rollingSum / n
		if (mean < best || best == -1)
			best = mean
	}

	//console.timeEnd("calculating mo" + n.toString())
	return best
}

// An "average", as opposed to a mean, removes the fastest and slowest time before taking the mean. 
// So an average of 5 will take the mean of the middle 3 solves
// This function calculates an average of a certain number of solves,
// taking into account which part of the solve to average (memo, exec, or the whole thing)
// and each solve's penalty status
export function calculateAvg(solves, section) {
	const dnfIndices = []
	const simpleSolves = solves.map(solve => getSimplifiedSolve(solve, section))
	let timeSum = 0
	let minTime = 999999999
	let maxTime = 0

	for (var i = 0; i < solves.length; i++) { 
		if (simpleSolves[i][1]) //need DNF count outside of loop so we know whether to override min time with a DNF
			dnfIndices.push(i)
	}

	for (var i = 0; i < solves.length; i++) {
		if (simpleSolves[i][0] < minTime && (section != 0 || dnfIndices.length > 1 || !simpleSolves[i][1]))
			minTime = simpleSolves[i][0]
		else if (simpleSolves[i][0] > maxTime)
			maxTime = simpleSolves[i][0]

		timeSum += simpleSolves[i][0]
	}

	if (section == 0 && dnfIndices.length == 1)
		timeSum -= simpleSolves[dnfIndices[0]][0]
	else
		timeSum -= maxTime
	timeSum -= minTime
	const avg = timeSum / (simpleSolves.length - 2)
	const dnf = (section == 0 && dnfIndices.length > 1)
	return [avg, dnf]
}

// This finds the best average of n solves in a whole session for each section of the solve
// Expects solves in the simplified format for the sake of optimisation
export function calculateBestAon(simplifiedSolves, section, n) {
	if (simplifiedSolves.length < n)
		return -1
		
	//console.time("calculating ao" + n.toString())
	let best = -1
	for (var first = 0; first < simplifiedSolves.length - n + 1; first++) {
		const dnfs = []
		let timeSum = 0
		let minTime = 999999999
		let maxTime = 0
		for (var j = 0; j < n; j++) {
			if (simplifiedSolves[first + j][1]) //need DNF count outside of loop so we know whether to override min time with a DNF
				dnfs.push(simplifiedSolves[first + j][0])
		}

		for (var j = 0; j < n; j++) {
			let solveTime = simplifiedSolves[first + j][0]

			if (solveTime < minTime && (section != 0 || dnfs.length > 1 || !simplifiedSolves[first + j][1]))
				minTime = solveTime
			else if (solveTime > maxTime)
				maxTime = solveTime

			timeSum += solveTime
		}
		if (section == 0 && dnfs.length == 1)
			maxTime = dnfs[0]

		const avg = (timeSum - maxTime - minTime) / (n - 2)
		const dnf = (section == 0 && dnfs.length > 1)

		if (dnf || avg == -1)
			continue
		if (avg < best || best == -1)
			best = avg
	}
	//console.timeEnd("calculating ao" + n.toString())
	return best
}

// Times are always stored in milliseconds, they must be converted into hours, minutes, seconds, and hundredths of a second
export function formatTime(ms) {
	const centiseconds = Math.round(ms / 10) // All times only go to 2 decimal places

	const hours = (Math.floor(centiseconds / 100 / 60 / 60))
	const minutes = (Math.floor(centiseconds / 100 / 60) % 60)
	const seconds = (Math.floor(centiseconds / 100) % 60)
	const hundredths = (centiseconds % 100)

	let timeStr = ""
	if (hours > 0) // Don't add hours if there are none
		timeStr += hours.toString() + ":" + (minutes < 10 ? "0" : "")
	if (minutes > 0) // Don't add minutes if there are none
		timeStr += minutes.toString() + ":" + (seconds < 10 ? "0" : "")
	timeStr += seconds.toString() + "." // Always have seconds and hundredths
	timeStr += (hundredths < 10 ? "0" : "") + hundredths.toString()

	return timeStr
}

// Solve time string takes the solve's penalty into account and writes it next to it if needed.
export function getSolveTimeString(solve) {
	const solveTime = formatTime(solve[0] + ((solve[2] === 2) ? 2000 : 0)) //Account for +2
	const modifier = solve[2] === 1 ? " (DNF)" : solve[2] === 2 ? "+" : ""
	// For no penalty: 25.32
	// For DNF: 25.32 (DNF)
	// For +2: 27.32+
	return solveTime + modifier
}

// This just returns the ratio of the 2 parts of the solve, ignoring any penalties.
export function getSolveRatioString(solve) {
	// E.g: (12.11 memo : 13.21 exec)
	return (solve[1] === 0) ? "" :
		(formatTime(solve[1]) + " : " + formatTime(solve[0] - solve[1]))
}