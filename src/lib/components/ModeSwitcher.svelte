<script lang="ts">
	import { mode, setMode } from "mode-watcher";
	import { Moon, Sun } from "@lucide/svelte";

	let checked = $state(mode.current === "dark");

	function updateMode(checked: boolean) {
		setMode(checked ? "dark" : "light");
	}
</script>

<label class="toggle text-base-content">
	<input
		type="checkbox"
		bind:checked={() => checked, updateMode}
		value="dark"
		class="theme-controller" />
	<Sun class="w-[1em] h-[1em]" />
	<Moon class="w-[1em] h-[1em]" />
</label>
