<script lang="ts">
	const { params, data } = $props();
	const game = data.game;
</script>

<img src={game.hero} class="w-0 h-0 hidden" aria-hidden="true" alt="" />

<div class="hero min-h-1/2" style="background-image: url({game.hero})">
	<div class="hero-overlay"></div>
	<div class="hero-content text-neutral-content text-center">
		<div class="max-w-md">
			<h1 class="mb-5 text-5xl font-bold">{game.name}</h1>
			<p class="mb-5">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
		</div>
	</div>
</div>
