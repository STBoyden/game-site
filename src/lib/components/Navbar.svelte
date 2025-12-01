<script>
	import ModeSwitcher from "./ModeSwitcher.svelte";
</script>

<div class="navbar bg-base-300 shadow-sm">
	<div class="navbar-start">
		<button class="btn btn-ghost text-xl">Game Site</button>
	</div>
	<div class="navbar-center w-lg">
		<label class="input input-md w-full">
			<span class="label">Search</span>
			<input type="text" placeholder="Search for a game..." />
		</label>
	</div>
	<div class="navbar-end">
		<ModeSwitcher />
	</div>
</div>
