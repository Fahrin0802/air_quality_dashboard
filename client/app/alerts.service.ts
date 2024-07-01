
const BASE_URL: string =
  "https://func-airqualitydashboard-prod.azurewebsites.net/api/alerts";

export interface Alert {
  id?: string;
  tenantId?: string;
  name: string;
  username: string;
  latitude: number;
  longitude: number;
  threshold: number;
  isabove: boolean;
}

export async function getAlerts(username: string) {
  try {
    // const url = `${BASE_URL}/${tenantId}`;
    const response = await fetch(`${BASE_URL}/${username}`, {
      method: "GET",
    });
    const res = await response.json();
    
    return res.resources;
  } catch (error) {
    console.log(error)
    return [];
  }
}

export async function createAlert(alert: Alert) {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      body: JSON.stringify(alert),
    });
    return response.text();
  } catch (error) {
    console.log(error)
    return null;
  }
}

export async function deleteAlert(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      return true; // Indicate successful deletion
    } else {
      throw new Error("Failed to delete alert");
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
