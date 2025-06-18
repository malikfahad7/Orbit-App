import axios from 'axios';

const BASE_URL = 'http://192.168.1.22:3000/api';

class MongoDatabase {
  static getStartDate(filter, now = new Date()) {
    if (filter === 'This Week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (filter === 'This Month') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (filter === 'Last 3 Months') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (filter === 'Last Month') return new Date(now.setMonth(now.getMonth() - 1));
    if (filter === 'Last 3 Months') return new Date(now.setMonth(now.getMonth() - 3));
    return null;
  }

  static async getUser(email, password) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (e) {
      console.error('Error fetching user:', e);
      throw e;
    }
  }

  static async getActionReportsByType(type) {
    try {
      if (!['gun', 'knife'].includes(type)) {
        throw new Error('Invalid type. Must be "gun" or "knife"');
      }
      console.log(`Fetching action reports with type: ${type}`);
      const response = await axios.get(`${BASE_URL}/action-reports/by-type/${type}`);
      console.log('getActionReportsByType response:', response.data);
      return response.data.reports || [];
    } catch (e) {
      console.log('Error in getActionReportsByType:', e.response?.data || e.message);
      throw new Error('Failed to fetch action reports by type');
    }
  }

  static async getRecommendedActionReportsByType(type) {
    try {
      if (!['guns', 'knife'].includes(type)) {
        throw new Error('Invalid type. Must be "guns" or "knife"');
      }
      console.log(`Fetching recommended action reports with type: ${type}`);
      const response = await axios.get(`${BASE_URL}/action-reports/recommended-by-type/${type}`);
      console.log('getRecommendedActionReportsByType response:', response.data);
      return response.data.reports || [];
    } catch (e) {
      console.log('Error in getRecommendedActionReportsByType:', e.response?.data || e.message);
      throw new Error('Failed to fetch recommended action reports');
    }
  }

  static async checkPersonnelByUserId(userId) {
    try {
      const response = await axios.get(`${BASE_URL}/personnel/check/${userId}`);
      console.log('checkPersonnelByUserId response:', response.data);
      return response.data.exists;
    } catch (e) {
      console.error('Error in checkPersonnelByUserId:', e.response?.data || e.message);
      throw new Error('Failed to check personnel');
    }
  }

  static async insertPersonnel(userId, personnelData) {
    try {
      const response = await fetch(`${BASE_URL}/personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...personnelData }),
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to insert personnel data');
      return data;
    } catch (e) {
      console.error('Error inserting personnel:', e);
      throw e;
    }
  }

  static async getPersonnelByUserId(userId) {
    try {
      const response = await axios.get(`${BASE_URL}/personnel/${userId}`);
      console.log('getPersonnelByUserId response:', response.data);
      return response.data || null;
    } catch (e) {
      console.error('Error in getPersonnelByUserId:', e.response?.data || e.message);
      throw new Error('Failed to fetch personnel data');
    }
  }

  static async updatePersonnel(userId, personnelData) {
    try {
      const response = await fetch(`${BASE_URL}/personnel/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personnelData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update personnel data');
      return data;
    } catch (e) {
      console.error('Error in updatePersonnel:', e.response?.data || e.message);
      throw new Error('Failed to update personnel data');
    }
  }

  static async getUnverifiedAlerts() {
    try {
      const response = await axios.get(`${BASE_URL}/alerts/unverified`);
      console.log('getUnverifiedAlerts response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getUnverifiedAlerts:', e.response?.data || e.message);
      return [];
    }
  }

  static async deleteAlert(id) {
    try {
      const response = await axios.delete(`${BASE_URL}/alerts/${id}`);
      console.log('deleteAlert response:', response.data);
      return response.data;
    } catch (e) {
      console.log('Error in deleteAlert:', e.response?.data || e.message);
      throw new Error('Failed to delete alert');
    }
  }

  static async updateAlertStatus(id, status) {
    try {
      const response = await axios.put(`${BASE_URL}/alerts/${id}/status`, { status });
      console.log('updateAlertStatus response:', response.data);
      return response.data;
    } catch (e) {
      console.log('Error in updateAlertStatus:', e.response?.data || e.message);
      throw new Error('Failed to update alert status');
    }
  }

  static async insertActionReport(actionReportData) {
    try {
      const response = await fetch(`${BASE_URL}/action-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionReportData),
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to insert action report');
      return data;
    } catch (e) {
      console.error('Error inserting action report:', e);
      throw e;
    }
  }

  static async updateFloorManagerStats(userId, reportsSubmitted, averageResponseTime) {
    try {
      const response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reportsSubmitted, averageResponseTime }),
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to update floor manager stats');
      return data;
    } catch (e) {
      console.error('Error updating floor manager stats:', e);
      throw e;
    }
  }

  static async getFloorManagerStats(userId) {
    try {
      const response = await axios.get(`${BASE_URL}/floormanagerstats/${userId}`);
      console.log('getFloorManagerStats response:', response.data);
      return response.data || null;
    } catch (e) {
      console.log('Error in getFloorManagerStats:', e.response?.data || e.message);
      return null;
    }
  }

  static async getUserId(email) {
    try {
      console.log('Fetching user ID for email:', email);
      const response = await axios.get(`${BASE_URL}/user-by-email/${encodeURIComponent(email)}`);
      console.log('getUserId response:', response.data);
      return response.data.userId;
    } catch (e) {
      console.log('Error in getUserId:', e.response?.data || e.message);
      return null;
    }
  }

  static async getVerifiedAndCompletedAlerts() {
    try {
      const response = await axios.get(`${BASE_URL}/alerts/verified-completed`);
      console.log('getVerifiedAndCompletedAlerts response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getVerifiedAndCompletedAlerts:', e.response?.data || e.message);
      return [];
    }
  }

  static async getFloorByEmail(email) {
    try {
      const response = await axios.get(`${BASE_URL}/floor-by-email/${encodeURIComponent(email)}`);
      console.log('getFloorByEmail response:', response.data);
      return response.data.floorNo;
    } catch (e) {
      console.log('Error in getFloorByEmail:', e.response?.data || e.message);
      return null;
    }
  }

  static async getFloorForManager(managerName) {
    try {
      const response = await axios.get(`${BASE_URL}/floor`, { params: { managerName } });
      console.log('getFloorForManager response:', response.data);
      return response.data.floorNo;
    } catch (e) {
      console.log('Error in getFloorForManager:', e.response?.data || e.message);
      return null;
    }
  }

  static async getReportsCountByUserId(userId, filter = 'All') {
    try {
      const params = { userId, filter };
      console.log('Sending request to get reports count with params:', params);
      const response = await axios.get(`${BASE_URL}/action-reports/count`, { params });
      console.log('getReportsCountByUserId response:', response.data);
      return response.data?.count ?? 0;
    } catch (e) {
      console.log('Error in getReportsCountByUserId:', e.response?.data || e.message);
      return 0;
    }
  }

  static async getActionReportBySuspiciousActivityId(suspiciousActivityId) {
    try {
      const response = await axios.get(`${BASE_URL}/action-report/${suspiciousActivityId}`);
      console.log('getActionReportBySuspiciousActivityId response:', response.data);
      return response.data;
    } catch (e) {
      console.log('Error in getActionReportBySuspiciousActivityId:', e.response?.data || e.message);
      return null;
    }
  }

  static async getAllAlerts(filter = 'All') {
    try {
      const params = {};
      if (filter !== 'All') {
        const startDate = this.getStartDate(filter);
        if (startDate) params.startDate = startDate.toISOString();
      }
      const response = await axios.get(`${BASE_URL}/alerts`, { params });
      console.log('getAllAlerts response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getAllAlerts:', e.response?.data || e.message);
      return [];
    }
  }

  static async getAllAlertsWithInprogress() {
    try {
      const response = await axios.get(`${BASE_URL}/alerts/inprogress-verified-completed`);
      console.log('getAllAlertsWithInprogress response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getAllAlertsWithInprogress:', e.response?.data || e.message);
      return [];
    }
  }

  static async getRespondedAlertsByUserId(userId, filter = 'All') {
    try {
      const params = { respondedBy: userId };
      if (filter !== 'All') {
        const startDate = this.getStartDate(filter);
        if (startDate) params.startDate = startDate.toISOString();
      }
      const response = await axios.get(`${BASE_URL}/alerts`, { params });
      console.log('getRespondedAlertsByUserId response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getRespondedAlertsByUserId:', e.response?.data || e.message);
      return [];
    }
  }

  static async getCompletedCases(filter = 'All') {
    try {
      const params = { status: 'completed' };
      if (filter !== 'All') {
        const startDate = this.getStartDate(filter);
        if (startDate) params.startDate = startDate.toISOString();
      }
      const response = await axios.get(`${BASE_URL}/alerts`, { params });
      console.log('getCompletedCases response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getCompletedCases:', e.response?.data || e.message);
      return [];
    }
  }

  static async getPendingCases(filter = 'All') {
    try {
      const params = { status: 'pending' };
      if (filter !== 'All') {
        const startDate = this.getStartDate(filter);
        if (startDate) params.startDate = startDate.toISOString();
      }
      const response = await axios.get(`${BASE_URL}/alerts`, { params });
      console.log('getPendingCases response:', response.data);
      return response.data || [];
    } catch (e) {
      console.log('Error in getPendingCases:', e.response?.data || e.message);
      return [];
    }
  }

  static async getActionReportsByUserId(userId, userEmail, filter = 'All') {
    try {
      const floorNo = await this.getFloorByEmail(userEmail);
      console.log('User floor number:', floorNo);
      if (!floorNo) throw new Error('Failed to fetch floor number for user');

      const params = { userId, floorNo };
      if (filter !== 'All') {
        const startDate = this.getStartDate(filter);
        if (startDate) params.startDate = startDate.toISOString();
      }

      console.log('Fetching action reports with params:', params);
      const response = await axios.get(`${BASE_URL}/action-reports`, { params });
      console.log('getActionReportsByUserId response:', response.data);
      return response.data.reports || [];
    } catch (e) {
      console.log('Error in getActionReportsByUserId:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        url: `${BASE_URL}/action-reports`,
        params,
      });
      throw new Error('Failed to fetch action reports');
    }
  }

  static async getSuspiciousActivityById(suspiciousActivityId) {
    try {
      console.log('Fetching suspicious activity for ID:', suspiciousActivityId);
      const response = await axios.get(`${BASE_URL}/suspicious-activity/${suspiciousActivityId.trim()}`);
      console.log('getSuspiciousActivityById response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (e) {
      console.log('Error in getSuspiciousActivityById:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        url: `${BASE_URL}/suspicious-activity/${suspiciousActivityId}`,
      });
      return null;
    }
  }
}

export default MongoDatabase;