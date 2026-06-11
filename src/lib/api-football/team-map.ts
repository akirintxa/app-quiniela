/** Mapeo país/slug API-Football → iso_code en nuestra tabla teams */
export const API_COUNTRY_TO_ISO: Record<string, string> = {
  Mexico: "MX",
  "South-Africa": "ZA",
  "South-Korea": "KR",
  "Czech-Republic": "CZ",
  Canada: "CA",
  "Bosnia-Herzegovina": "BA",
  Qatar: "QA",
  Switzerland: "CH",
  Brazil: "BR",
  Morocco: "MA",
  Haiti: "HT",
  Scotland: "GB-SCT",
  USA: "US",
  Paraguay: "PY",
  Australia: "AU",
  Turkey: "TR",
  Germany: "DE",
  Curacao: "CW",
  "Ivory-Coast": "CI",
  Ecuador: "EC",
  Netherlands: "NL",
  Japan: "JP",
  Sweden: "SE",
  Tunisia: "TN",
  Belgium: "BE",
  Egypt: "EG",
  Iran: "IR",
  "New-Zealand": "NZ",
  Spain: "ES",
  "Cape-Verde": "CV",
  "Saudi-Arabia": "SA",
  Uruguay: "UY",
  France: "FR",
  Senegal: "SN",
  Iraq: "IQ",
  Norway: "NO",
  Argentina: "AR",
  Algeria: "DZ",
  Austria: "AT",
  Jordan: "JO",
  Portugal: "PT",
  "DR-Congo": "CD",
  Uzbekistan: "UZ",
  Colombia: "CO",
  England: "GB-ENG",
  Croatia: "HR",
  Ghana: "GH",
  Panama: "PA",
};

const API_NAME_TO_ISO: Record<string, string> = {
  "Korea Republic": "KR",
  "Cote D'Ivoire": "CI",
  "Côte d'Ivoire": "CI",
  "Czechia": "CZ",
  "United States": "US",
  "Bosnia & Herzegovina": "BA",
  "Bosnia and Herzegovina": "BA",
  "Cape Verde": "CV",
  "Saudi Arabia": "SA",
  "New Zealand": "NZ",
  "South Korea": "KR",
  "Congo DR": "CD",
  "Congo": "CD",
};

export function apiTeamToIso(team: {
  name?: string | null;
  country?: string | null;
}): string | null {
  if (team.country && API_COUNTRY_TO_ISO[team.country]) {
    return API_COUNTRY_TO_ISO[team.country];
  }
  if (team.name && API_NAME_TO_ISO[team.name]) {
    return API_NAME_TO_ISO[team.name];
  }
  if (team.country) {
    const normalized = team.country.replace(/\s+/g, "-");
    if (API_COUNTRY_TO_ISO[normalized]) return API_COUNTRY_TO_ISO[normalized];
  }
  return null;
}
