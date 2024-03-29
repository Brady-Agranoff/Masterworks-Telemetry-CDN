if (mw_telemetry_settings.custom_event_configurations && mw_telemetry_settings.custom_event_configurations.length > 0) {
	mw_telemetry_settings.custom_event_configurations.forEach((configuration) => {
		if (!configuration.event_name || typeof configuration.event_name !== "string") {
			throw new MasterworksTelemetryError("Invalid custom_event_configurations.event_name: " + configuration.event_name);
		}

		if (!configuration.triggers || !Array.isArray(configuration.triggers) || configuration.triggers.length === 0) {
			throw new MasterworksTelemetryError("Invalid custom_event_configurations.triggers: " + configuration.triggers);
		}

		configuration.triggers.forEach((trigger) => {});

		if (!configuration.platforms || !Array.isArray(configuration.platforms) || configuration.platforms.length === 0) {
			throw new MasterworksTelemetryError("Invalid custom_event_configurations.platforms: " + configuration.platforms);
		}

		configuration.platforms.forEach((platform) => {
			if (!platform.name || typeof platform.name !== "string") {
				throw new MasterworksTelemetryError("Invalid custom_event_configurations.platforms.name: " + platform.name);
			}

			if (!platform.event_type || typeof platform.event_type !== "string") {
				throw new MasterworksTelemetryError("Invalid custom_event_configurations.platforms.event_type: " + platform.event_type);
			}

			if (platform.name === "illumin" && !platform.illumin_pg && typeof platform.illumin_pg !== number) {
				throw new MasterworksTelemetryError("Invalid custom_event_configurations.platforms.illumin_pg: " + platform.illumin_pg);
			}
		});

		configuration.triggers.forEach((trigger) => {
			try {
				const initializeInterval = setInterval(() => {
					if (typeof set_mw_trigger !== "undefined") {
						set_mw_trigger(trigger, () => {
							triggerMWCustomEvent(configuration);
						});
						clearInterval(initializeInterval);
					}
				}, 100);
			} catch (error) {
				console.error(error);
			}
		});
	});
}

function triggerMWCustomEvent(configuration) {
	configuration.platforms.forEach((platform) => {
		handlePlatformEvent(platform, configuration);
	});
}

function handlePlatformEvent(platform, configuration) {
	switch (platform.name) {
		case "rudderstack":
			fireRudderstackCustomEvent(platform.event_type, configuration.event_name, configuration.metadata);
			break;
		case "piwik":
			firePiwikCustomEvent(platform.event_type, configuration.event_name, platform.options);
			break;
		case "facebook":
			fireFacebookCustomEvent(platform.event_type, configuration.event_name, platform.options, configuration.metadata);
			break;
		case "adform":
			fireAdformCustomEvent(platform.event_type, configuration.event_name);
			break;
		case "zemanta":
			fireZemantaCustomEvent(platform.event_type);
			break;
		case "tiktok":
			fireTiktokCustomEvent(platform.event_type, configuration.event_name, configuration.metadata);
			break;
		case "illumin":
			fireIlluminCustomEvent(platform.illumin_pg);
			break;
		case "google_ads":
			fireGoogleAdsCustomEvent(platform.event_type, configuration.event_name, platform.options);
			break;
		case "taboola":
			fireTaboolaCustomEvent(platform.event_type, configuration.event_name);
			break;
		case "twitter":
			fireTwitterCustomEvent(platform.event_type);
			break;
		case "reddit":
			fireRedditCustomEvent(platform.event_type);
			break;
		case "pinterest":
			firePinterestCustomEvent(platform.event_type);
			break;
		case "tradedesk":
			fireTradedeskCustomEvent(platform.event_type, configuration.event_name, platform.options);
			break;
		case "linkedin":
			fireLinkedInCustomEvent(platform.options);
			break;
		default:
			throw new MasterworksTelemetryError("Invalid platform: " + platform.name);
	}
}

function fireRudderstackCustomEvent(event_type, event_name, metadata = {}) {
	if (typeof rudderanalytics === "undefined") {
		throw new MasterworksTelemetryError("rudderanalytics is undefined");
	}

	metadata.event_name = event_name;
	rudderanalytics.track(event_type, metadata);
}

function firePiwikCustomEvent(event_type, event_name, options = {}) {
	if (options && options.matomo_conflict) {
		if (typeof _ppas === "undefined") {
			throw new MasterworksTelemetryError("_ppas is undefined");
		}

		_ppas.push(["trackEvent", "mw_cv", `mw_cv : ${event_type}`, `mw_cv : ${event_type} : ${event_name}`, 0]);
	} else {
		if (typeof _paq === "undefined") {
			throw new MasterworksTelemetryError("_paq is undefined");
		}

		_paq.push(["trackEvent", "mw_cv", `mw_cv : ${event_type}`, `mw_cv : ${event_type} : ${event_name}`, 0]);
	}
}

function fireFacebookCustomEvent(event_type, event_name, options = {}, metadata = {}) {
	if (typeof fbq === "undefined") {
		throw new MasterworksTelemetryError("fbq is undefined");
	}

	if (options.facebook_track_custom) {
		fbq("trackCustom", event_type, { content_name: event_name, ...metadata });
		return;
	}

	fbq("track", event_type, { content_name: event_name, ...metadata });
}

function fireAdformCustomEvent(event_type, event_name) {
	if (typeof mw_telemetry_settings.adform_pixel_id === "undefined") {
		throw new MasterworksTelemetryError("mw_telemetry_settings.adform_pixel_id is undefined");
	}

	window._adftrack = Array.isArray(window._adftrack) ? window._adftrack : window._adftrack ? [window._adftrack] : [];
	window._adftrack.push({
		pm: mw_telemetry_settings.adform_pixel_id,
		divider: encodeURIComponent("|"),
		pagename: encodeURIComponent(`MW-${event_type}`),
		order: {
			sv1: event_name,
			sv8: event_name,
			sv97: event_name,
		},
	});
	(function () {
		var s = document.createElement("script");
		s.type = "text/javascript";
		s.async = true;
		s.src = "https://a2.adform.net/serving/scripts/trackpoint/async/";
		var x = document.getElementsByTagName("script")[0];
		x.parentNode.insertBefore(s, x);
	})();
}

function fireZemantaCustomEvent(event_type) {
	if (typeof zemApi === "undefined") {
		throw new MasterworksTelemetryError("zemApi is undefined");
	}

	// Track Event
	zemApi("track", event_type);
}

function fireTiktokCustomEvent(event_type, event_name, metadata = {}) {
	if (typeof ttq === "undefined") {
		throw new MasterworksTelemetryError("ttq is undefined");
	}

	ttq.track(event_type, {
		content_name: event_name,
		...metadata,
	});
}

function fireIlluminCustomEvent(illumin_pg) {
	if (typeof aap === "undefined") {
		throw new MasterworksTelemetryError("aap is undefined");
	}

	if (typeof illumin_pg === "undefined") {
		throw new MasterworksTelemetryError("illumin_pg is undefined");
	}

	if (typeof mw_telemetry_settings.illumin_pixel_id === "undefined") {
		throw new MasterworksTelemetryError("mw_telemetry_settings.illumin_pixel_id is undefined");
	}

	aap({
		pixelKey: mw_telemetry_settings.illumin_pixel_id,
		pg: illumin_pg,
	});
}

function fireGoogleAdsCustomEvent(event_type, event_name, options = {}) {
	if (typeof gtag === "undefined") {
		throw new MasterworksTelemetryError("gtag is undefined");
	}

	if (!options.google_ads_send_to_ids || !Array.isArray(options.google_ads_send_to_ids) || options.google_ads_send_to_ids.length === 0) {
		throw new MasterworksTelemetryError("Invalid options.google_ads_send_to_ids: " + options.google_ads_send_to_ids);
	}

	for (let i = 0; i < options.google_ads_send_to_ids.length; i++) {
		gtag("event", event_type, {
			send_to: options.google_ads_send_to_ids[i],
		});
	}
}

function fireTaboolaCustomEvent(event_type, event_name) {
	if (typeof _tfa === "undefined") {
		throw new MasterworksTelemetryError("_tfa is undefined");
	}

	if (typeof mw_telemetry_settings.taboola_pixel_id === "undefined") {
		throw new MasterworksTelemetryError("mw_telemetry_settings.taboola_pixel_id is undefined");
	}

	_tfa.push({ notify: "event", name: event_type, id: mw_telemetry_settings.taboola_pixel_id });
}

function fireTwitterCustomEvent(event_type) {
	if (typeof twq === "undefined") {
		throw new MasterworksTelemetryError("twq is undefined");
	}

	twq("track", event_type);
}

function fireRedditCustomEvent(event_type) {
	if (typeof rdt === "undefined") {
		throw new MasterworksTelemetryError("rdt is undefined");
	}

	rdt("track", event_type);
}

function fireTradedeskCustomEvent(event_type, event_name, options = {}) {
	if (mw_telemetry_settings.tradedesk_advertiser_id === undefined) {
		throw new MasterworksTelemetryError("mw_telemetry_settings.tradedesk_advertiser_id is undefined");
	}

	if (options.tradedesk_tracking_tag_ids === undefined || !Array.isArray(options.tradedesk_tracking_tag_ids) || options.tradedesk_tracking_tag_ids.length === 0) {
		throw new MasterworksTelemetryError("Invalid options.tradedesk_tracking_tag_ids: " + options.tradedesk_tracking_tag_ids);
	}

	for (let i = 0; i < options.tradedesk_tracking_tag_ids.length; i++) {
		var img = document.createElement("img");
		img.setAttribute("height", "1");
		img.setAttribute("width", "1");
		img.setAttribute("style", "border-style:none;");
		img.setAttribute("alt", "");
		img.setAttribute(
			"src",
			`https://insight.adsrvr.org/track/pxl/?adv=${mw_telemetry_settings.tradedesk_advertiser_id}&ct=${options.tradedesk_tracking_tag_ids[i]}&fmt=3` + "&td1=" + event_type + "&td2=" + event_name
		);
		document.body.appendChild(img);
	}
}

function firePinterestCustomEvent(event_type) {
	if (typeof pintrk === "undefined") {
		throw new MasterworksTelemetryError("pintrk is undefined");
	}

	pintrk("track", event_type);
}

function fireLinkedInCustomEvent(options = {}) {
	if (typeof window.lintrk === "undefined") {
		throw new MasterworksTelemetryError("window.lintrk is undefined");
	}

	if (typeof options.linkedin_conversion_id === "undefined") {
		throw new MasterworksTelemetryError("options.linkedin_conversion_id is undefined");
	}

	window.lintrk("track", { conversion_id: options.linkedin_conversion_id });
}

function writeEventToDataLayer(event_name, metadata = {}) {
	let dataLayer = window.dataLayer || [];
	dataLayer.push({
		event: "mw_custom_event_telemetry",
		event_name: event_name,
		metadata: metadata,
	});
}
