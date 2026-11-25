<script lang="ts">
	import { page } from '$app/state';
	import { PUBLIC_FRONTEND_URL } from '$app/env/public';

	type BaseProps = {
		title: string;
		description: string;
		path?: string; // canonical path; defaults to the current pathname
		imageAlt?: string;
		type?: 'website' | 'article';
	};

	// Either use the shared default image (no image props at all),
	// or provide a custom image together with its dimensions.
	type ImageProps =
		| { image?: undefined; imageWidth?: never; imageHeight?: never }
		| { image: string; imageWidth: number; imageHeight: number };

	type Props = BaseProps & ImageProps;

	const SITE_NAME = 'APP_DISPLAY_NAME';
	const DEFAULT_IMAGE = '/og-image.png';
	const DEFAULT_IMAGE_ALT = 'APP_DEFAULT_IMAGE_ALT';
	const DEFAULT_IMAGE_WIDTH = 1200;
	const DEFAULT_IMAGE_HEIGHT = 630;

	let {
		title,
		description,
		path,
		image,
		imageWidth,
		imageHeight,
		imageAlt,
		type = 'website'
	}: Props = $props();

	const fullTitle = $derived(title === SITE_NAME ? title : `${title} | ${SITE_NAME}`);

	// Built from the configured base URL, so query strings and alternate
	// hostnames never leak into the canonical.
	const canonical = $derived(new URL(path ?? page.url.pathname, PUBLIC_FRONTEND_URL).href);
	const imageUrl = $derived(new URL(image ?? DEFAULT_IMAGE, PUBLIC_FRONTEND_URL).href);
	const alt = $derived(imageAlt ?? DEFAULT_IMAGE_ALT);
	const width = $derived(imageWidth ?? DEFAULT_IMAGE_WIDTH);
	const height = $derived(imageHeight ?? DEFAULT_IMAGE_HEIGHT);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content={String(width)} />
	<meta property="og:image:height" content={String(height)} />
	<meta property="og:image:alt" content={alt} />

	<!-- Twitter / X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={alt} />
</svelte:head>
