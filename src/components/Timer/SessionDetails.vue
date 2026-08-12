<script setup>
	import { computed, ref } from 'vue'
	import { useTimerStore } from "@/stores/TimerStore"
	import { formatTime } from '@/helpers/timer.js'
	const timerStore = useTimerStore()

	const props = defineProps({
		sessionID: Number,
	})
	function format(stat) {
		if (!Array.isArray(stat)) {
			//Best average
			if (stat == -1)
				return "---"
			return formatTime(stat)
		}

		if (stat[0] == -1)
			return "---"
		if (stat[1])
			return "DNF (" + formatTime(stat[0]) + ")"

		return formatTime(stat[0])
	}

	const data = computed({
		get: () => {
			console.time("Fetching session statistics")
			const result = timerStore.getSessionStatistics(props.sessionID, section.value).map((statRow) => ({
				name: statRow[0],
				current: format(statRow[1]),
				best: format(statRow[2])
			}))
			console.timeEnd("Fetching session statistics")
			return result
		}
	})

	const section = ref(0)

	const dnfRatio = computed({
		get: () => {
			const dnfs = timerStore.getDnfCount(props.sessionID)
			return [timerStore.getSession(props.sessionID).solves.length - dnfs, dnfs]
		}
	})
</script>

<template>
	<!--Contains info like single, mo3, ao5, etc. for this session-->
	<div v-if="timerStore.isValidSessionID(sessionID)" style="display: flex; flex-direction: column; gap: 5px;">
		<div style="display: flex; flex-direction: column; border: 1px solid var(--el-border-color); border-radius: 4px;">
			<el-table :data="data" size="small" style="border-radius: 4px;" border>
				<el-table-column prop="name" label="" width="90">
					<template #header>
						<el-select size="small" v-model="section" style="font-size: 0.2rem;">
							<el-option :value="0" label="Full">Full</el-option>
							<el-option :value="1" label="Memo">Memo</el-option>
							<el-option :value="2" label="Exec">Exec</el-option>
						</el-select>
					</template>
				</el-table-column>
				<el-table-column prop="current" label="Current" width="99" />
				<el-table-column prop="best" label="Best" width="99" />
			</el-table>
		</div>
		<el-text style="text-align:center;">{{dnfRatio[0]}} successes : {{dnfRatio[1]}} DNFs</el-text>
	</div>
	<div v-else>
	</div>
</template>