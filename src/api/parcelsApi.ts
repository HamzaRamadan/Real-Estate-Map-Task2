import axios from "axios";

const FEATURE_SERVICE_URL = "https://infomapapp.com/ksaarcgis/rest/services/Hosted/AbuDhabi_Boundary/FeatureServer/2/query";

export const fetchParcels = async () => {
  const params = {
    f: "json",
    where: "1=1",
    outFields: "*",
    returnGeometry: false
  };

  const response = await axios.get(FEATURE_SERVICE_URL, { params });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.data.features.map((f: any) => f.attributes);
};
