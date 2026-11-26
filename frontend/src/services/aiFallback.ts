import { getAQICategory } from '../constants/mockData';
import { AssistantReply, ChatContext } from '../types';

const FALLBACK_MODEL_NAME = 'Local Contextual Fallback';

function createFallbackReply(text: string, cards: [string, string][]): AssistantReply {
  return {
    text,
    cards,
    isLiveGenAI: false,
    modelUsed: FALLBACK_MODEL_NAME,
  };
}

/**
 * Generate a deterministic contextual response when the backend AI service is unreachable.
 */
export function buildLocalAssistantReply(question: string, context: ChatContext): AssistantReply {
  const q = question.toLowerCase();
  const c = getAQICategory(context.aqi);
  const hi = context.aqi > 200;
  const pre = `In ${context.loc}, the AQI is currently ${context.aqi} (${c.name}) with PM2.5 at ${context.pm25} µg/m³. `;

  if (/outside|safe|go out/.test(q)) {
    return createFallbackReply(
      pre + (hi ? 'I recommend keeping outdoor time short and essential today.' : 'Outdoor activity is generally fine, with care for sensitive family members.'),
      [
        ['Wear a fitted N95/FFP2 if you must go out', 'Surgical and cloth masks filter far fewer fine particles.'],
        ['Choose midday for errands', 'Smog often eases after late morning as surface temperatures rise and the inversion layer lifts.'],
      ]
    );
  }

  if (/family|child|kid|smog|elder/.test(q)) {
    return createFallbackReply(
      pre + `Given your household of ${context.fam} people and sensitive individuals (${context.sens}), prioritize clean indoor air zones. Check with a doctor for specific health concerns.`,
      [
        ['Keep windows closed in early morning and night', 'Pollution peaks when cold, stagnant night air traps vehicular and burning emissions.'],
        ['Run a HEPA purifier in the bedroom', 'Cuts fine particulate exposure where your family spends 7–9 continuous hours.'],
        ['Swap outdoor play for indoor activities', 'Children breathe more air per kilogram of body weight, increasing toxic dose.'],
      ]
    );
  }

  if (/exercise|workout|run|jog|walk/.test(q)) {
    return createFallbackReply(
      pre + (hi ? 'Move today’s workout indoors to avoid breathing heavy concentrations of fine particles.' : 'Early afternoon is typically cleaner than early morning or evening.'),
      [
        ['Exercise indoors when AQI > 200', 'Higher breathing rates cause deep alveolar deposition of PM2.5 and ultrafine particles.'],
        ['Avoid arterial roadways', 'Nitrogen dioxide and particulate matter spike within 300 meters of heavy traffic corridors.'],
      ]
    );
  }

  if (/indoor|home|purifier|room|clean/.test(q)) {
    return createFallbackReply(
      pre + 'Indoor air quality closely tracks outdoor pollution. Focus on preventing outdoor infiltration and reducing indoor emission sources.',
      [
        ['Ventilate briefly when AQI dips', 'A 10–15 minute airing between 1 PM and 3 PM exchanges stale air with lower outdoor particulate load.'],
        ['Wet-mop instead of sweeping', 'Dry sweeping re-suspends settled particles back into your breathing zone.'],
        ['Use kitchen exhaust during and after cooking', 'Cooking oil fumes and gas combustion are significant indoor PM2.5 and VOC sources.'],
      ]
    );
  }

  if (/pm2|pm 2|high/.test(q)) {
    return createFallbackReply(
      pre + 'When PM2.5 levels are elevated, minimize direct exposure and avoid adding indoor combustion sources.',
      [
        ['Wear a certified N95/FFP2 respirator', 'Fine particles smaller than 2.5 microns penetrate directly into the bloodstream.'],
        ['Seal windows and run true HEPA filtration', 'High-efficiency particulate filters capture 99.97% of particles down to 0.3 microns.'],
        ['Avoid burning incense or candles', 'Indoor burning generates volatile organic compounds and fine carbonaceous soot.'],
      ]
    );
  }

  if (/reduce|contribut|emission|carbon|green/.test(q)) {
    return createFallbackReply(
      'Individual actions aggregate into meaningful community benefits. Note: Carbon reductions are transparent estimates, not measured air quality changes.',
      [
        ['Shift to metro, bus or carpool', 'Saves approximately 1.8 kg CO₂e per 15 km trip compared to a solo combustion vehicle.'],
        ['Cook with lids and exhaust on', 'Reduces fuel consumption and prevents indoor particulate buildup.'],
        ['Unplug idle electronic devices', 'Eliminating vampire standby power reduces continuous grid power demand.'],
      ]
    );
  }

  return createFallbackReply(
    pre + 'I can assist you with outdoor safety planning, family health advisories, exercise timing, indoor air management, and sustainable personal choices. Select any suggested prompt or type your query below.',
    [
      ['Plan outdoor trips around peak smog', 'Avoid early morning and late evening rush hours.'],
      ['Check purifier filter condition', 'Inspect pre-filters monthly to maintain optimum clean air delivery rate (CADR).'],
    ]
  );
}
