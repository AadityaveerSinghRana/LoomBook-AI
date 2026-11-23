import type { Story, ReaderEvent, PageEngagementScore, SteerSuggestion } from '../types.ts';

export const SEED_STORIES: Story[] = [
  {
    id: 'clockwork-sentinel',
    title: 'The Clockwork Sentinel',
    subtitle: 'A tale of brass wings, silent rooftops, and forgotten chimes',
    genre: 'Clockwork Mystery',
    audience: 'Middle Grade & Young Adult',
    prompt: 'A brass clockwork owl guards a midnight library above a foggy city and discovers a missing chime inside an old folio.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_clockwork_owl_1795118105916.jpg',
    createdAt: '2026-11-18T14:20:00.000Z',
    updatedAt: '2026-11-19T09:10:00.000Z',
    storyBible: {
      premise: 'Every night at twelve, a mechanical owl winds the city’s memory bells from the library balcony—until one bell refuses to ring.',
      protagonist: 'Archimedes-7, a polite brass owl whose chest lantern dims whenever a story is left unfinished.',
      setting: 'The Rainwater Athenaeum overlooking slate rooftops, gaslit alleys, and a distant clocktower.',
      toneRules: 'Atmospheric, tactile, gentle wonder mixed with crisp clockwork suspense; avoid overly modern slang.',
      plotArc: 'Discovery of silence -> clue in the margin -> rooftop pursuit -> restoring the lost chord.',
      pacingNotes: 'Page 2 slows down for archival exposition; ideal for subtle suspense or sensory intrigue if readers skim.'
    },
    pages: [
      {
        id: 'cs-page-0',
        storyId: 'clockwork-sentinel',
        pageIndex: 0,
        chapterTitle: 'The Balcony Watch',
        prose: 'Mist curled over the slate gables like ink spilled across damp vellum. On the stone balustrade of the Rainwater Athenaeum, Archimedes-7 clicked his brass talons twice, waiting for the midnight bell from St. Jude’s spire.\n\nInside his ribcage, a thumb-sized amber filament pulsed with steady warmth. For forty winters he had counted every chime, recording the city’s dreams on narrow scrolls tucked beneath his left wing. Tonight, however, the mist stayed stubbornly quiet.',
        illustrationCue: 'Brass clockwork owl perched on a gothic stone balcony beneath a crescent moon and misty rooftops.',
        pacingIntent: 'Establish setting, tactile clockwork sensory details, and the inciting absence of sound.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-18T14:20:00.000Z'
      },
      {
        id: 'cs-page-1',
        storyId: 'clockwork-sentinel',
        pageIndex: 1,
        chapterTitle: 'The Unwound Folio',
        prose: 'Archimedes hopped through the arched casement into the upper gallery, where tall oak shelves smelled of clove oil and cold stone. Beneath a green-shaded lamp lay an open folio bound in faded indigo linen.\n\nSomeone had underlined a single sentence in silver graphite: "When the seventh bell falls silent, check the sparrow’s gear." His chest filament flickered twice—a sure sign that an unfinished chapter was nearby.',
        illustrationCue: 'Moonlit library gallery with oak shelves and an open indigo folio under a brass reading lamp.',
        pacingIntent: 'Introduce the central clue inside the library.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-18T14:20:00.000Z'
      },
      {
        id: 'cs-page-2',
        storyId: 'clockwork-sentinel',
        pageIndex: 2,
        chapterTitle: 'Ledgers of Dust',
        prose: 'Across three long tables, the Athenaeum kept its winter catalog of borrowed keys, wax seals, and weather almanacs. Archimedes paced from ledger to ledger, comparing dates in neat columns while rain tapped softly against the leaded panes.\n\nRow after row listed ordinary repairs: a new hinge for the map drawer, two ounces of linseed oil for the north door, three spools of copper wire for the reading room.',
        illustrationCue: 'Quiet library table covered in leather ledgers and brass calipers during gentle rain.',
        pacingIntent: 'Investigative breathing room; slightly slower archival cataloguing.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-18T14:20:00.000Z'
      },
      {
        id: 'cs-page-3',
        storyId: 'clockwork-sentinel',
        pageIndex: 3,
        chapterTitle: 'Across the Spire',
        prose: 'Gathering the rolled parchment in his talons, the owl launched from the parapet into the silver fog. Below him, lantern light pooled along wet cobblestones while chimney smoke drifted eastward toward the great clocktower.\n\nHalfway across the square, a tiny copper sparrow darted from behind a gargoyle, clutching a silver tuning key almost too heavy for its wings.',
        illustrationCue: 'Clockwork owl gliding over wet rooftops chasing a small copper sparrow carrying a silver key.',
        pacingIntent: 'Escalate motion and reveal the thief.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-18T14:20:00.000Z'
      },
      {
        id: 'cs-page-4',
        storyId: 'clockwork-sentinel',
        pageIndex: 4,
        chapterTitle: 'The Seventh Chime',
        prose: 'High inside the belfry, the sparrow had not stolen the key out of malice—it had built a nest inside the cracked bell-cradle to shelter three shivering fledglings from the gale. Archimedes tilted his head, his gears whirring softly.\n\nInstead of seizing the key, he wound the secondary spring by hand, letting the seventh bell hum just gently enough to rock the nest without waking the sleepers below.',
        illustrationCue: 'Warm golden light inside a quiet clocktower belfry with the brass owl beside a sheltered nest.',
        pacingIntent: 'Gentle emotional resolution that honors the story’s tender tone.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-18T14:20:00.000Z'
      }
    ]
  },
  {
    id: 'sea-glass-harbor',
    title: 'The Sea-Glass Harbor',
    subtitle: 'Lanterns along the translucent cliffs of Tidewatch',
    genre: 'Maritime Fantasy',
    audience: 'All Ages',
    prompt: 'A young ferry-keeper rows through cliffs made of glowing sea-glass to deliver letters that only appear at twilight.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_glass_harbor_1795118105288.jpg',
    createdAt: '2026-11-17T18:05:00.000Z',
    updatedAt: '2026-11-18T21:40:00.000Z',
    storyBible: {
      premise: 'At blue hour, letters written on kelp-vellum surface in Tidewatch Harbor, and only Mara’s lantern reveals who they are meant for.',
      protagonist: 'Mara, a quiet harbour rower with a hooded wool cloak and two amber oil lanterns.',
      setting: 'Coves carved from turquoise and amber sea-glass, moored schooners, and tide-lit cliffside doorways.',
      toneRules: 'Lyrical, calm, luminous imagery of water, glass, and twilight; concise evocative sentences.',
      plotArc: 'Twilight departure -> an unaddressed bottle -> navigating the echoing narrows -> reunion at the pier.',
      pacingNotes: 'Maintain sensory rhythm between quiet water reflections and gentle mystery.'
    },
    pages: [
      {
        id: 'sg-page-0',
        storyId: 'sea-glass-harbor',
        pageIndex: 0,
        chapterTitle: 'Blue Hour Departure',
        prose: 'When the sun slipped behind the outer breakwater, the cliffs of Tidewatch began to glow from within. Veins of turquoise and honeyed amber caught the dusk, turning the entire harbor into a lantern.\n\nMara dipped her ashwood oar without a splash. On the prow beside her sat a brass oil lamp and a waterproof satchel holding seven sealed envelopes.',
        illustrationCue: 'Hooded rower in a wooden skiff drifting between glowing turquoise sea-glass cliffs at twilight.',
        pacingIntent: 'Set serene visual atmosphere and introduce Mara’s nightly task.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-17T18:05:00.000Z'
      },
      {
        id: 'sg-page-1',
        storyId: 'sea-glass-harbor',
        pageIndex: 1,
        chapterTitle: 'The Unmarked Seal',
        prose: 'Six of the letters bore clear names written in salt-ink: the rope-maker on East Arch, the baker above the slipway, the twin lighthouse keepers. The seventh envelope, however, carried no name at all—only a pressed sprig of sea-lavender.\n\nAs Mara held it near her lantern flame, faint silver script bloomed across the corner: "To whoever still waits by the low bell."',
        illustrationCue: 'Close-up of a damp wax-sealed envelope glowing faintly beside a warm brass boat lantern.',
        pacingIntent: 'Introduce the mystery letter.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-17T18:05:00.000Z'
      },
      {
        id: 'sg-page-2',
        storyId: 'sea-glass-harbor',
        pageIndex: 2,
        chapterTitle: 'The Echoing Narrows',
        prose: 'Past the moored schooners, the sea-glass walls leaned closer until the sky became a narrow ribbon of indigo stars. Every ripple against the hull rang like a tapped wineglass.\n\nHalfway through the channel, the tide tugged unexpectedly sideways, drawing her skiff toward a forgotten stone landing half-hidden behind emerald crystal.',
        illustrationCue: 'Wooden boat passing through a narrow canyon of luminous sea-glass cliffs under twilight stars.',
        pacingIntent: 'Build quiet tension as the tide steers her off route.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-17T18:05:00.000Z'
      },
      {
        id: 'sg-page-3',
        storyId: 'sea-glass-harbor',
        pageIndex: 3,
        chapterTitle: 'The Low Bell Landing',
        prose: 'On the mossy quay stood an elderly cartographer holding an unlit storm lantern, his coat flecked with sea-spray. When Mara lifted her oar and stepped ashore, he recognized the sprig of lavender before she spoke a word.\n\n"Forty tides I thought that letter lost beyond the bar," he whispered, lighting his wick from hers until both cliffs answered with a warm golden reflection.',
        illustrationCue: 'Elderly cartographer greeting Mara on a sea-glass quay as their two lanterns ignite.',
        pacingIntent: 'Deliver heartfelt closure.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-17T18:05:00.000Z'
      }
    ]
  },
  {
    id: 'cartographers-conservatory',
    title: 'The Cartographer’s Conservatory',
    subtitle: 'Where silver ferns chart constellations yet unseen',
    genre: 'Botanical Speculative',
    audience: 'Adult & Literary Illustrated',
    prompt: 'Inside a Victorian glasshouse, an apprentice discovers that the silver ferns align their fronds to map stars not yet visible in the sky.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_cartographer_garden_1795118104949.jpg',
    createdAt: '2026-11-16T11:30:00.000Z',
    updatedAt: '2026-11-18T16:15:00.000Z',
    storyBible: {
      premise: 'A botanical conservatory doubles as a living celestial observatory; its silver ferns lean toward unmapped stars before astronomers can spot them.',
      protagonist: 'Julian, a meticulous apprentice illustrator who prefers inked diagrams to guesswork.',
      setting: 'Arched iron-and-glass conservatory packed with terracotta pots, hanging ferns, and antique brass armillary spheres.',
      toneRules: 'Precision, botanical wonder, quiet intellectual discovery.',
      plotArc: 'Routine sketching -> noticing identical frond angles -> aligning the astrolabe -> charting a hidden comet.',
      pacingNotes: 'Keep technical wonder grounded in tactile paper, ink, and brass details.'
    },
    pages: [
      {
        id: 'cc-page-0',
        storyId: 'cartographers-conservatory',
        pageIndex: 0,
        chapterTitle: 'Morning Over the Glasshouse',
        prose: 'Steam lingered beneath the iron ribs of the south conservatory, softening the morning sun into milky gold. Julian sharpened his nib, opened his linen sketchbook, and began measuring the silver-veined maidenhair beside the stone pedestal.\n\nFor three days in a row, every fern in the room had tilted fourteen degrees west—away from the sunlight rather than toward it.',
        illustrationCue: 'Sunlit Victorian glasshouse filled with hanging ferns, stone pedestals, and brass astrolabes.',
        pacingIntent: 'Introduce Julian and the uncanny botanical anomaly.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-16T11:30:00.000Z'
      },
      {
        id: 'cc-page-1',
        storyId: 'cartographers-conservatory',
        pageIndex: 1,
        chapterTitle: 'The Brass Armillary',
        prose: 'Curious, Julian set his pencil down and rotated the outer ring of the nearest brass astrolabe until its sighting vane matched the spine of the tallest fern. Through the narrow slit, his eye traced a line past the frosted glass roof.\n\nIn the pale blue morning sky, a faint silver smudge—invisible to the naked eye—hung motionless beside the crescent moon’s shadow.',
        illustrationCue: 'Brass armillary sphere aligned beside leafy silver ferns beneath an arched glass roof.',
        pacingIntent: 'Connect botany and astronomy into one revelation.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-16T11:30:00.000Z'
      },
      {
        id: 'cc-page-2',
        storyId: 'cartographers-conservatory',
        pageIndex: 2,
        chapterTitle: 'The Living Chart',
        prose: 'By dusk, Julian had mapped twelve different fern beds onto a single translucent sheet of vellum. Overlaid together, their leaning fronds traced the unmistakable arc of an approaching comet.\n\nHe dipped his pen once more, adding a quiet note in the margin: "The sky speaks first to the leaves."',
        illustrationCue: 'Sketchbook page showing translucent star maps overlaid on delicate fern drawings.',
        pacingIntent: 'Conclude with quiet awe and discovery.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-16T11:30:00.000Z'
      }
    ]
  },
  {
    id: 'paper-lighthouse',
    title: 'The Paper Lighthouse',
    subtitle: 'Folded chart-linen, basalt squalls, and a beam built for lost mail',
    genre: 'Coastal Fable',
    audience: 'All Ages',
    prompt: 'Every autumn, a retired chartmaker folds a towering lighthouse from waxed sea-charts on a basalt headland to guide overdue mail skiffs safely through the fog.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_paper_lighthouse_1795119354793.jpg',
    createdAt: '2026-11-15T15:10:00.000Z',
    updatedAt: '2026-11-18T11:20:00.000Z',
    storyBible: {
      premise: 'When the stone lighthouse falls dark for repairs, an old cartographer folds a temporary beacon out of beeswaxed nautical charts that shines only along remembered coastlines.',
      protagonist: 'Captain Elias Vane, a patient paper-folder whose thumbprint smells of cedar resin and beeswax.',
      setting: 'Black Basalt Point above wind-whipped indigo swells, crescent moonlit clouds, and a cedar-shingled chart hut.',
      toneRules: 'Crisp maritime nouns, tactile paper creases, quiet resolve against storm wind.',
      plotArc: 'The stone lens cracks -> folding the chart tower -> lighting the lantern in a gale -> guiding the winter mail boat home.',
      pacingNotes: 'Balance technical paper-folding craft with growing storm urgency.'
    },
    pages: [
      {
        id: 'pl-page-0',
        storyId: 'paper-lighthouse',
        pageIndex: 0,
        chapterTitle: 'The Waxed Folio',
        prose: 'When the iron lantern atop Black Basalt Point shattered in the October squall, the harbor council feared the winter mail packet would miss the narrow channel entirely. Elias Vane said nothing; he simply carried three rolls of beeswaxed chart linen out onto the wet headland.\n\nEach sheet bore faded soundings, compass roses, and inked coastlines his grandfather had drawn fifty years before. Elias knelt beside the slate foundation and made the first crisp diagonal crease.',
        illustrationCue: 'Old cartographer kneeling on dark coastal rock folding giant cream sea-chart sheets in twilight wind.',
        pacingIntent: 'Establish the crisis and the surreal craft of paper architecture.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-15T15:10:00.000Z'
      },
      {
        id: 'pl-page-1',
        storyId: 'paper-lighthouse',
        pageIndex: 1,
        chapterTitle: 'Ribs of Compass Rose',
        prose: 'By moonrise, the creases had risen into an octagonal tower four stories tall, braced only by interlocking pleats and copper grommets. Whenever the salt wind struck its flanks, the paper hummed like a taut mainsail rather than tearing.\n\nThrough the high arched window, Elias hoisted an ordinary oil wick inside a blown-glass chimney. Instantly, the translucent chart walls blushed warm amber, projecting faint latitude lines out across the foam.',
        illustrationCue: 'Tall folded origami paper lighthouse glowing warm amber against dark indigo ocean swells.',
        pacingIntent: 'Reveal the completed glowing structure against the storm.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-15T15:10:00.000Z'
      },
      {
        id: 'pl-page-2',
        storyId: 'paper-lighthouse',
        pageIndex: 2,
        chapterTitle: 'Soundings in the Fog',
        prose: 'Out beyond the outer shoal, fog thickened until even the bell buoy vanished in grey wool. Inside the paper gallery, Elias noticed the warmth of the wick softening the beeswax along the northern seam—the very wall facing the gale.\n\nInstead of lowering the flame, he pinned his own brass pocket divider across the fold and sang the harbor’s old sounding counts to steady his shaking hands.',
        illustrationCue: 'Inside the glowing paper lantern room as wind presses the translucent nautical-chart walls.',
        pacingIntent: 'Heighten tension as heat and wind threaten the folded seam.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-15T15:10:00.000Z'
      },
      {
        id: 'pl-page-3',
        storyId: 'paper-lighthouse',
        pageIndex: 3,
        chapterTitle: 'Harbor of Creased Light',
        prose: 'At two bells past midnight, a muffled horn answered from the surf. The mail skiff slipped cleanly past the basalt teeth, its helmsman steering straight for the impossible amber column standing above the cliff.\n\nBy dawn, the wax had cooled hard as horn, leaving the folded lighthouse intact—a map that had finally become the harbor it once only described.',
        illustrationCue: 'Small wooden mail skiff gliding safely into calm harbor waters beneath the glowing paper lighthouse at dawn.',
        pacingIntent: 'Deliver quiet triumph and lasting wonder.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-15T15:10:00.000Z'
      }
    ]
  },
  {
    id: 'velvet-observatory',
    title: 'The Velvet Observatory',
    subtitle: 'An unscheduled winter train stop beneath swirling brass constellations',
    genre: 'Celestial Folklore',
    audience: 'Middle Grade & Young Adult',
    prompt: 'A midnight mountain train stops at an unlisted snow-covered observatory where travelers can glimpse one forgotten childhood star.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_velvet_observatory_1795119355118.jpg',
    createdAt: '2026-11-14T19:45:00.000Z',
    updatedAt: '2026-11-18T08:30:00.000Z',
    storyBible: {
      premise: 'Once every solstice, the Starry Ridge Express pauses beside a copper-domed observatory where passengers trade punched railway tickets for a turn at the brass telescope.',
      protagonist: 'Nora, a drowsy violinist returning home for winter who cannot remember the melody her brother taught her.',
      setting: 'A midnight-blue timber railway carriage, snow-heavy spruce pines, and a stone observatory under swirling golden constellations.',
      toneRules: 'Cozy winter wonder, velvet warmth against crisp mountain frost, musical imagery.',
      plotArc: 'Unscheduled halt in snow -> stepping into the copper dome -> peering at a mapped memory -> boarding with a restored tune.',
      pacingNotes: 'Slow, enveloping winter quiet with a bright emotional lift at the climax.'
    },
    pages: [
      {
        id: 'vo-page-0',
        storyId: 'velvet-observatory',
        pageIndex: 0,
        chapterTitle: 'The Unlisted Halt',
        prose: 'Steam hissed softly beneath the floorboards as the midnight-blue carriage slowed beside a ridge that appeared on no printed timetable. Outside the frosted pane, spruce boughs bowed under fresh snow, and a copper dome glowed like an ember against the pines.\n\nThe conductor tapped Nora’s violin case with two gloved fingers. "Fifteen minutes for anyone wishing to check the upper sky," he said gently, sliding the brass vestibule door wide.',
        illustrationCue: 'Antique midnight-blue train carriage stopped in deep snow beside a lantern-lit stone observatory.',
        pacingIntent: 'Establish cozy train interior contrasting with the crisp alpine halt.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-14T19:45:00.000Z'
      },
      {
        id: 'vo-page-1',
        storyId: 'velvet-observatory',
        pageIndex: 1,
        chapterTitle: 'Ticket for the Dome',
        prose: 'Inside the observatory, cedarwood stairs smelled of clove tea and warm brass polish. An astronomer in a velvet waistcoat accepted Nora’s half-punched train stub without glancing at the destination stamp.\n\n"Every lost bar of music drifts upward eventually," she murmured, turning a heavy spoked wheel until the copper shutter parted on swirling ribbons of gold stars.',
        illustrationCue: 'Warm observatory interior with brass gears, velvet coats, and an open dome revealing golden constellations.',
        pacingIntent: 'Introduce the astronomer and the magical premise.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-14T19:45:00.000Z'
      },
      {
        id: 'vo-page-2',
        storyId: 'velvet-observatory',
        pageIndex: 2,
        chapterTitle: 'Through the Eyepiece',
        prose: 'When Nora pressed her eye to the cool brass lens, she did not see distant nebulae. She saw five bright stars arranged exactly like the penciled notes along the top stave of her brother’s torn sheet music.\n\nAs the clockwork drive ticked softly beneath the dome, the five stars pulsed in three-quarter time, steady as a hearth-fire.',
        illustrationCue: 'Close-up of a brass telescope eyepiece reflecting five golden stars shaped like musical notes.',
        pacingIntent: 'Deliver the central visual revelation.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-14T19:45:00.000Z'
      },
      {
        id: 'vo-page-3',
        storyId: 'velvet-observatory',
        pageIndex: 3,
        chapterTitle: 'Whistle Across the Pine',
        prose: 'The locomotive whistle echoed twice down the valley, calling travelers back to their warm velvet seats. Nora hurried down the snowy path, humming the five-note waltz cleanly into her wool scarf.\n\nAs the train pulled away around the bend, the observatory shutter clicked shut—leaving only golden tracks fading behind the last lantern.',
        illustrationCue: 'Train departing along snowy ridge tracks as passengers look back toward the copper observatory.',
        pacingIntent: 'Warm departure and resolved memory.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-14T19:45:00.000Z'
      }
    ]
  },
  {
    id: 'apricot-orchard-clock',
    title: 'The Apricot Orchard Clock',
    subtitle: 'Terraced stone steps, sunlit fruit, and seasons kept out of order',
    genre: 'Pastoral Speculative',
    audience: 'Adult & Literary Illustrated',
    prompt: 'On a terraced Mediterranean hillside, each stone tier of an apricot orchard blooms in a different decade, preserving the valley’s quiet promises.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_apricot_orchard_1795119354871.jpg',
    createdAt: '2026-11-13T10:15:00.000Z',
    updatedAt: '2026-11-17T14:50:00.000Z',
    storyBible: {
      premise: 'A hillside orchard ripens tier by tier according to forgotten promises rather than the calendar, guided by a limestone cottage sundial.',
      protagonist: 'Soraia, a botanical archivist returning to settle her grandmother’s hillside estate.',
      setting: 'Sun-warmed limestone terraces, wild lavender borders, gnarled apricot boughs, and a tile-roofed sundial house.',
      toneRules: 'Sunlit, unhurried, sensory warmth of warm stone, ripe fruit skin, and dry rosemary.',
      plotArc: 'Arrival at the terraces -> noticing out-of-season fruit -> reading the sundial notch -> keeping an old orchard vow.',
      pacingNotes: 'Gentle pastoral rhythm; let dialogue and sensory observations breathe.'
    },
    pages: [
      {
        id: 'ao-page-0',
        storyId: 'apricot-orchard-clock',
        pageIndex: 0,
        chapterTitle: 'The Seven Stone Steps',
        prose: 'Even in late October, the lowest terrace smelled sharply of July. Soraia paused halfway up the limestone steps, brushing dry lavender with her sleeve while golden apricots hung heavy and warm against the gnarled bark.\n\nAbove her, however, the fourth terrace stood bare in crisp spring blossom, white petals drifting lazily across the sundial gable.',
        illustrationCue: 'Terraced hillside stone path flanked by blooming and fruiting apricot trees beneath golden afternoon clouds.',
        pacingIntent: 'Set the temporal pastoral mystery immediately through sensory contrast.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-13T10:15:00.000Z'
      },
      {
        id: 'ao-page-1',
        storyId: 'apricot-orchard-clock',
        pageIndex: 1,
        chapterTitle: 'The Sundial Gable',
        prose: 'Mounted high under the cottage eaves, the brass sundial carried Roman numerals only up to seven—and its iron gnomon cast no shadow at all until a hand touched the wooden door latch.\n\nInside the cool limestone kitchen lay her grandmother’s pruning ledger, open to a margin note dated forty summers prior: "Leave the third bough unharvested until the twin cousin returns from sea."',
        illustrationCue: 'Small stone orchard cottage with a brass wall sundial and rosemary pots beside a timber door.',
        pacingIntent: 'Connect the orchard’s strange seasons to family memory.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-13T10:15:00.000Z'
      },
      {
        id: 'ao-page-2',
        storyId: 'apricot-orchard-clock',
        pageIndex: 2,
        chapterTitle: 'Weight of the Harvest',
        prose: 'Soraia carried a woven reed basket back down to the third tier, where two apricots glowed deep amber among silver-green leaves. She hesitated—whether to pick them now and break the wait, or leave them suspended in eternal August.\n\nFootsteps crunched softly along the gravel lane below, followed by the unmistakable clink of a salt-stained canvas kitbag.',
        illustrationCue: 'Woven basket beside golden apricots on a sunlit stone wall as evening shadows lengthen down the valley.',
        pacingIntent: 'Create gentle anticipation right before the reunion.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-13T10:15:00.000Z'
      },
      {
        id: 'ao-page-3',
        storyId: 'apricot-orchard-clock',
        pageIndex: 3,
        chapterTitle: 'One Season Together',
        prose: 'When her cousin stepped onto the terrace and tasted the warm fruit she placed in his palm, a soft rustle passed upward through all seven stone tiers at once.\n\nFor the first time in forty years, every bough on the hillside shed its blossoms and settled peacefully into the same golden autumn dusk.',
        illustrationCue: 'Two figures sharing ripe apricots on a sunlit terrace overlooking misty hills at sunset.',
        pacingIntent: 'Serene emotional resolution.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-13T10:15:00.000Z'
      }
    ]
  },
  {
    id: 'porcelain-violinist',
    title: 'The Porcelain Violinist',
    subtitle: 'Candlelit canals, fired clay, and strings tuned to unspoken truths',
    genre: 'Acoustic Mystery',
    audience: 'Young Adult & Literary',
    prompt: 'A Venetian luthier crafts a delicate violin from white porcelain that refuses to sound a single note until someone speaks an overdue apology.',
    llmProvider: 'gemini-4-hydrogen',
    coverUrl: '/src/assets/images/storybook_porcelain_violin_1795119353245.jpg',
    createdAt: '2026-11-12T20:00:00.000Z',
    updatedAt: '2026-11-18T09:40:00.000Z',
    storyBible: {
      premise: 'Matteo fires a feather-thin violin from river porcelain; though strung with finest gut, its voice remains mute to ordinary bows.',
      protagonist: 'Matteo Bellini, a quiet luthier who listens to canal water lapping beneath his workshop window.',
      setting: 'A green-plastered Venetian workshop lit by beeswax tapers, overlooking stone bridges and dark emerald canal reflections.',
      toneRules: 'Intimate, nocturnal, tactile craft of wood shavings, clay glaze, and candlelight.',
      plotArc: 'Finishing the porcelain glaze -> testing the mute strings -> an unexpected late visitor -> the first resonant chord.',
      pacingNotes: 'Hold quiet acoustic intimacy; every sound in the workshop should feel deliberate.'
    },
    pages: [
      {
        id: 'pv-page-0',
        storyId: 'porcelain-violinist',
        pageIndex: 0,
        chapterTitle: 'The White Body',
        prose: 'Beeswax tapers guttered beside the brass candlestick as Matteo laid the cream porcelain violin across a square of unbleached linen. Its scroll gleamed with tiny hand-gilded vines, yet the belly was thinner than an eggshell.\n\nOutside the arched casement, a lone gondola slipped beneath the stone bridge, trailing silver ripples across the emerald canal.',
        illustrationCue: 'Candlelit Venetian luthier bench with a cream porcelain violin resting on linen beside glowing tapers.',
        pacingIntent: 'Introduce the fragile craft and quiet canal atmosphere.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-12T20:00:00.000Z'
      },
      {
        id: 'pv-page-1',
        storyId: 'porcelain-violinist',
        pageIndex: 1,
        chapterTitle: 'Mute Gut and Rosin',
        prose: 'Matteo drew a freshly rosined horsehair bow across the D-string. Instead of a tone, only a dry whisper crossed the workbench—as though the hollow clay chamber were holding its breath.\n\nHe checked the maple soundpost twice with a sliver of mirror. Everything sat flush to the millimeter, yet the instrument stayed stubbornly silent.',
        illustrationCue: 'Luthier inspecting the bridge and f-holes of a white porcelain violin under warm oil-lamp light.',
        pacingIntent: 'Deepen the central acoustic puzzle.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-12T20:00:00.000Z'
      },
      {
        id: 'pv-page-2',
        storyId: 'porcelain-violinist',
        pageIndex: 2,
        chapterTitle: 'Knock at the Water Gate',
        prose: 'Just before midnight, an oar bumped the timber steps below. Up the stairs came Clara, Matteo’s former apprentice, her cloak damp with lagoon mist and her eyes fixed on the white violin.\n\n"I threw away the mold you trusted me with ten winters ago," she confessed softly to the floor planks. "I was too proud to admit I cracked it in the kiln."',
        illustrationCue: 'Young woman in a damp cloak standing in the candlelit doorway of the Venetian workshop.',
        pacingIntent: 'Introduce the emotional catalyst for the instrument’s secret.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-12T20:00:00.000Z'
      },
      {
        id: 'pv-page-3',
        storyId: 'porcelain-violinist',
        pageIndex: 3,
        chapterTitle: 'Resonance on Water',
        prose: 'Before Matteo could answer, a clear, bell-like hum rose from the oak workbench on its own—vibrating in sympathy with Clara’s quiet voice. The candle flames swayed once in unison.\n\nMatteo lifted the porcelain violin and placed the bow gently into her hands. This time, when she drew it across the strings, the entire canal carried a note bright as blown glass.',
        illustrationCue: 'Apprentice playing the glowing cream porcelain violin beside the arched canal window at night.',
        pacingIntent: 'Cathartic acoustic and relational resolution.',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: '2026-11-12T20:00:00.000Z'
      }
    ]
  }
];

export const SEED_EVENTS: ReaderEvent[] = [
  {
    id: 'evt-seed-1',
    storyId: 'clockwork-sentinel',
    pageIndex: 0,
    sessionId: 'sess-alpha',
    eventType: 'page_view',
    dwellMs: 0,
    createdAt: '2026-11-19T08:50:00.000Z'
  },
  {
    id: 'evt-seed-2',
    storyId: 'clockwork-sentinel',
    pageIndex: 0,
    sessionId: 'sess-alpha',
    eventType: 'dwell',
    dwellMs: 24500,
    createdAt: '2026-11-19T08:50:25.000Z'
  },
  {
    id: 'evt-seed-3',
    storyId: 'clockwork-sentinel',
    pageIndex: 1,
    sessionId: 'sess-alpha',
    eventType: 'dwell',
    dwellMs: 19200,
    createdAt: '2026-11-19T08:50:45.000Z'
  },
  {
    id: 'evt-seed-4',
    storyId: 'clockwork-sentinel',
    pageIndex: 2,
    sessionId: 'sess-alpha',
    eventType: 'fast_skip',
    dwellMs: 2100,
    createdAt: '2026-11-19T08:51:00.000Z'
  },
  {
    id: 'evt-seed-5',
    storyId: 'clockwork-sentinel',
    pageIndex: 2,
    sessionId: 'sess-beta',
    eventType: 'fast_skip',
    dwellMs: 1850,
    createdAt: '2026-11-19T08:52:00.000Z'
  }
];

export const SEED_SCORES: PageEngagementScore[] = [
  {
    storyId: 'clockwork-sentinel',
    pageIndex: 0,
    engagementScore: 80,
    avgDwellMs: 24500,
    viewCount: 1,
    fastSkipCount: 0,
    consecutiveFastSkips: 0,
    rereadCount: 0,
    regenerateCount: 0,
    editCount: 0,
    abandonCount: 0,
    troubleTriggered: false,
    troubleReason: null,
    updatedAt: '2026-11-19T08:50:25.000Z'
  },
  {
    storyId: 'clockwork-sentinel',
    pageIndex: 1,
    engagementScore: 80,
    avgDwellMs: 19200,
    viewCount: 1,
    fastSkipCount: 0,
    consecutiveFastSkips: 0,
    rereadCount: 0,
    regenerateCount: 0,
    editCount: 0,
    abandonCount: 0,
    troubleTriggered: false,
    troubleReason: null,
    updatedAt: '2026-11-19T08:50:45.000Z'
  },
  {
    storyId: 'clockwork-sentinel',
    pageIndex: 2,
    engagementScore: 36,
    avgDwellMs: 1975,
    viewCount: 2,
    fastSkipCount: 2,
    consecutiveFastSkips: 2,
    rereadCount: 0,
    regenerateCount: 0,
    editCount: 0,
    abandonCount: 0,
    troubleTriggered: true,
    troubleReason: '2 consecutive fast skips (<4s dwell)',
    updatedAt: '2026-11-19T08:52:00.000Z'
  }
];

export const SEED_SUGGESTIONS: SteerSuggestion[] = [
  {
    id: 'steer-seed-1',
    storyId: 'clockwork-sentinel',
    troublePageIndex: 2,
    targetPageIndex: 3,
    triggerReason: '2 consecutive fast skips (<4s dwell) on Page 3 ("Ledgers of Dust")',
    engagementScoreAtTrigger: 36,
    selectedOptionId: null,
    status: 'pending',
    autoApplyAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    createdAt: '2026-11-19T08:52:05.000Z',
    resolvedAt: null,
    options: [
      {
        id: 'opt-tension',
        direction: 'more_tension',
        label: 'More Tension',
        title: 'Add a Ticking Lantern Threat',
        rationale: 'Page 3 lingered on archival ledger details. Open Page 4 with Archimedes’ chest filament flickering low and an unseen shadow cutting the library bell-rope.',
        previewHook: 'As Archimedes launched into the rain-swept square, his chest lantern dropped to a perilous ember—someone had snipped the bronze relay wire from the roof.',
        confidenceRank: 1
      },
      {
        id: 'opt-lighter',
        direction: 'lighter_tone',
        label: 'Lighter Tone',
        title: 'Playful Rooftop Banter',
        rationale: 'Contrast the quiet cataloguing on Page 3 with a brisk, witty aerial chase where the copper sparrow leaves tiny brass crumbs behind.',
        previewHook: 'A polite sneeze echoed from the gutter spout, and out popped a copper sparrow wearing a thimble like an aviator’s helmet.',
        confidenceRank: 2
      },
      {
        id: 'opt-twist',
        direction: 'plot_twist',
        label: 'Plot Twist',
        title: 'The Missing Signature in the Ledger',
        rationale: 'Reveal that the stolen tuning key belonged to Archimedes’ own maker, linking the library’s silence to an unfinished clockwork sibling.',
        previewHook: 'Etched along the underside of the sparrow’s silver key were the initials A-6—the prototype owl everyone thought dismantled.',
        confidenceRank: 3
      }
    ]
  }
];
