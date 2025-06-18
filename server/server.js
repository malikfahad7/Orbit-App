require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://Orbit:fyp_Orbit_123.@orbit.auwwr.mongodb.net/Orbit?retryWrites=true&w=majority&appName=Orbit';
const COLLECTION_NAME = 'users';

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'doe01tx5g',
  api_key: process.env.CLOUDINARY_API_KEY || '168745793817754',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'biAhcu8eU0NBZ-SCdlGAYXka1KE',
});

let db;
async function connectToMongo() {
  const client = new MongoClient(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    db = client.db('Orbit');
    console.log('Connected to MongoDB');
    return db;
  } catch (e) {
    console.error('Failed to connect to MongoDB:', e.message, e.stack);
    throw e;
  }
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne({ email, role: 'Floor Manager' });

    if (user && bcrypt.compareSync(password, user.password)) {
      const fallbackName = user.name || email.split('@')[0] || 'Unknown User';
      res.json({
        _id: user._id.toString(),
        name: fallbackName,
        email: user.email,
        floor: user.floor,
        profileImageUrl: user.profileImageUrl || null,
      });
    } else {
      res.status(401).json(null);
    }
  } catch (e) {
    console.error('Error in /api/login:', e.message, e.stack);
    res.status(500).json(null);
  }
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json(null);
    }
    res.json({
      email: user.email,
      password: user.password,
    });
  } catch (e) {
    console.error('Error in /api/users/:id:', e.message, e.stack);
    res.status(500).json(null);
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection(COLLECTION_NAME);
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = bcrypt.hashSync(password, 10);

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (e) {
    console.error('Error in /api/users/:id:', e.message, e.stack);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/users/:id/profile-image', async (req, res) => {
  const { id } = req.params;
  const { profileImageUrl } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { profileImageUrl } }
    );
    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (e) {
    console.error('Error in /api/users/:id/profile-image', e.message, e.stack);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/cloudinary-signature', (req, res) => {
  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({ error: 'public_id is required' });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp: timestamp,
      invalidate: true,
      public_id: public_id,
    };
    console.log('Parameters to sign:', paramsToSign);
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET || 'biAhcu8eU0NBZ-SCdlGAYXka1KE');
    console.log('Generated signature:', signature);
    return res.json({
      signature: signature,
      timestamp: timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY || '168745793817754',
      success: true
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/personnel/check/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('personnels');
    const personnel = await collection.findOne({ userId: new ObjectId(userId) });
    res.json({ exists: !!personnel });
  } catch (error) {
    console.error('Error in /api/personnel/check:', error);
    res.status(500).json({ exists: false });
  }
});

app.post('/api/personnel', async (req, res) => {
  const { userId, CNIC, PhoneNo, Address, AdditionalInfo } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    if (!userId || !CNIC || !PhoneNo || !Address || !AdditionalInfo) {
      console.error('Missing required fields:', { userId, CNIC, PhoneNo, Address, AdditionalInfo });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { DateOfBirth, Gender, MaritalStatus } = AdditionalInfo;
    if (!DateOfBirth || !Gender || !MaritalStatus) {
      console.error('Missing required AdditionalInfo fields:', { DateOfBirth, Gender, MaritalStatus });
      return res.status(400).json({ success: false, message: 'Missing required AdditionalInfo fields' });
    }

    const parsedDateOfBirth = new Date(DateOfBirth);
    if (isNaN(parsedDateOfBirth.getTime())) {
      console.error('Invalid DateOfBirth format:', DateOfBirth);
      return res.status(400).json({ success: false, message: 'Invalid DateOfBirth format' });
    }

    const validGenders = ['Male', 'Female'];
    const validMaritalStatuses = ['Single', 'Married'];
    if (!validGenders.includes(Gender)) {
      console.error('Invalid Gender value:', Gender);
      return res.status(400).json({ success: false, message: 'Invalid Gender value' });
    }
    if (!validMaritalStatuses.includes(MaritalStatus)) {
      console.error('Invalid MaritalStatus value:', MaritalStatus);
      return res.status(400).json({ success: false, message: 'Invalid MaritalStatus value' });
    }

    const collection = db.collection('personnels');
    const personnelData = {
      userId: new ObjectId(userId),
      CNIC,
      PhoneNo,
      Address,
      AdditionalInfo: {
        DateOfBirth: parsedDateOfBirth,
        Gender,
        MaritalStatus,
      },
    };
    console.log('Inserting personnel:', personnelData);

    const data = await collection.insertOne(personnelData);
    console.log('Personnel insertion result:', data);

    res.json({ success: true, insertedId: data.insertedId });
  } catch (error) {
    console.error('Error in /api/personnel:', error.message);
    res.status(500).json({ success: false, message: `Failed to insert personnel data: ${error.message}` });
  }
});

app.get('/api/personnel/:userId', async (req, res) => {
  const { userId } = req.query;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('personnels');
    const personnel = await collection.findOne({ userId: new ObjectId(userId) });
    if (!personnelData) {
      return res.status(404).json(null);
    }
    res.json(data);
  } catch (error) {
    console.error('Error in /api/personnel/:userId:', error);
    res.status(500).json(null);
  }
});

app.put('/api/personnel/:userId/user', async (req, res) => {
  const { userId } = req.params.id;
  const { PhoneNo, Address, AdditionalInfo } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('personnels');
    const objectId = new ObjectId(userId);

    const updateData = {};
    if (PhoneNo !== undefined) updateData.PhoneNo = PhoneNo;
    if (Address !== undefined) updateData.Address = Address;
    if (AdditionalInfo !== undefined) updateData.additionalInfo = AdditionalInfo;

    const data = await collection.updateOne(
      { userId: objectId },
      { $set: updateData },
      { upsert: false }
    );

    if (data.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Personnel not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/personnel/:userId:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/alerts/unverified', async (req, res) => {
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    const alerts = await collection.find({ Verification: 'unverified' })
      .sort({ TimeStamp: -1 }) // Sort by TimeStamp descending (newest first)
      .toArray();
    res.json(alerts);
  } catch (error) {
    console.error('Error in /api/alerts/unverified:', error);
    res.status(500).json([]);
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    await collection.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/alerts/:id:', error);
    res.status(500).json({ success: false });
  }
});

app.put('/api/alerts/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { Verification: status } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/alerts/:id/status:', error);
    res.status(500).json({ success: false });
  }
});

app.get('/api/alert/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    const activity = await collection.findOne({ _id: new ObjectId(id) });
    if (!activity) {
      console.log('Alert not found for _id:', id);
      return res.status(404).json({ error: 'Alert not found' });
    }
    console.log('Fetched alert for _id:', id, activity);
    res.json(activity);
  } catch (error) {
    console.error('Error in /api/alert/:id:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

app.post('/api/alert/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { verification } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    if (verification !== 'verified') {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }
    const collection = db.collection('suspiciousactivities');
    const data = await collection.deleteOne({ _id: new ObjectId(id) });
    if (data.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Alert not found' });
    }
  } catch (error) {
    console.error('Error in /api/alert/:id/verify:', error);
    res.status(500).json({ success: false, message: 'Failed to verify and delete alert' });
  }
});

app.get('/api/action-report/:suspiciousActivityId', async (req, res) => {
  const { suspiciousActivityId } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('actionreports');
    const report = await collection.findOne({ SuspiciousActivityId: suspiciousActivityId });
    if (!report) {
      return res.status(404).json({ error: 'Action report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error in /api/action-report/:suspiciousActivityId:', error);
    res.status(500).json({ error: 'Failed to fetch action report' });
  }
});

app.put('/api/action-report/:id/update-images', async (req, res) => {
  const { id } = req.params;
  const { ImageUrls } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('actionreports');
    const data = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ImageUrls } }
    );
    if (data.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Action report not found' });
    }
  } catch (error) {
    console.error('Error in /api/action-report/:id/update-images:', error);
    res.status(500).json({ success: false, message: 'Failed to update action report' });
  }
});

app.get('/api/floor-by-email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const floorsCollection = db.collection('floors');
    const floorDoc = await floorsCollection.findOne({ email });
    if (!floorDoc) {
      return res.status(404).json({ error: 'Floor not found for this email' });
    }
    res.json({ floorNo: floorDoc.FloorNo.toString() });
  } catch (error) {
    console.error('Error in /api/floor-by-email:', error);
    res.status(500).json({ error: 'Failed to fetch floor number' });
  }
});

app.post('/api/action-report', async (req, res) => {
  const actionReportData = req.body;

  console.log('Received Action Report Data:', actionReportData);

  if (!actionReportData.userId || !actionReportData.SuspiciousActivityId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    if (!db) throw new Error('Database not connected');
    const actionReportsCollection = db.collection('actionreports');
    const floorManagerStatsCollection = db.collection('floormanagerstats');
    const suspiciousActivitiesCollection = db.collection('suspiciousactivities');

    // Fetch the Type from suspiciousactivities collection
    const suspiciousActivity = await suspiciousActivitiesCollection.findOne({
      SuspiciousActivityId: actionReportData.SuspiciousActivityId.trim(),
    });
    if (!suspiciousActivity) {
      return res.status(404).json({ success: false, message: 'Suspicious activity not found' });
    }
    const type = suspiciousActivity.Type;

    const insertResult = await actionReportsCollection.insertOne({
      ...actionReportData,
      createdAt: moment().tz('Asia/Karachi').toISOString(true),
      ImageUrls: actionReportData.ImageUrls || [],
    });

    console.log('Insert result:', insertResult);

    if (!insertResult || !insertResult.insertedId) {
      return res.status(500).json({ success: false, message: 'Failed to insert action report' });
    }

    const userId = actionReportData.userId;
    const reports = await actionReportsCollection.find({ userId }).toArray();
    console.log('Fetched reports for user:', reports);

    let totalResponseTime = 0;
    let validResponseTimes = 0;

    for (const report of reports) {
      const suspiciousActivityId = report.SuspiciousActivityId;
      console.log('Processing report:', report._id, 'with SuspiciousActivityId:', suspiciousActivityId);

      if (!suspiciousActivityId) {
        console.warn('Missing SuspiciousActivityId for report:', report._id);
        continue;
      }

      const alert = await suspiciousActivitiesCollection.findOne({
        SuspiciousActivityId: suspiciousActivityId.trim(),
      });
      console.log('Fetched alert for report', report._id, ':', JSON.stringify(alert, null, 2));

      if (!alert || !alert.TimeStamp || !report.createdAt) {
        console.warn(
          'Missing data for response time calculation:',
          'Alert:', alert ? 'found' : 'not found',
          'Alert TimeStamp:', alert?.TimeStamp || 'missing',
          'Report createdAt:', report.createdAt || 'missing'
        );
        continue;
      }

      const alertTime = new Date(alert.TimeStamp);
      const reportTime = new Date(report.createdAt);
      console.log('Alert Time:', alertTime, 'Report Time:', reportTime);

      if (isNaN(alertTime.getTime()) || isNaN(reportTime.getTime())) {
        console.warn(
          'Invalid dates for report:',
          report._id,
          'Alert Time:', alert.TimeStamp,
          'Parsed Alert Time:', alertTime,
          'Report Time:', report.createdAt,
          'Parsed Report Time:', reportTime
        );
        continue;
      }

      const timeDiff = (reportTime - alertTime) / (1000 * 60);
      console.log('Time difference (minutes):', timeDiff);

      if (timeDiff >= 0) {
        totalResponseTime += timeDiff;
        validResponseTimes += 1;
      } else {
        console.warn(
          'Negative time difference for report:',
          report._id,
          'Alert Time:', alert.TimeStamp,
          'Report Time:', report.createdAt
        );
      }
    }

    const averageResponseTime = validResponseTimes > 0 ? Math.round(totalResponseTime / validResponseTimes) : 0;
    console.log('Computed average response time (minutes):', averageResponseTime, 'Valid response times:', validResponseTimes);

    const reportsCountQuery = { userId };
    const reportsCount = await actionReportsCollection.countDocuments(reportsCountQuery);
    console.log(`Counted ${reportsCount} reports for userId: ${userId}`);

    let floorManagerStats = await floorManagerStatsCollection.findOne({ UserId: userId });

    if (!floorManagerStats) {
      floorManagerStats = {
        UserId: userId,
        ReportsSubmitted: reportsCount,
        averageResponseTime: averageResponseTime,
        numberOfCasesCompleted: 0,
        numberOfCasesInProgress: 1,
      };
      await floorManagerStatsCollection.insertOne(floorManagerStats);
      console.log(`Created new stats for user ${userId}:`, floorManagerStats);
    } else {
      await floorManagerStatsCollection.updateOne(
        { UserId: userId },
        {
          $set: {
            ReportsSubmitted: reportsCount,
            averageResponseTime: averageResponseTime,
          },
          $inc: { numberOfCasesInProgress: 1 },
        }
      );
      console.log(`Updated stats for user ${userId}: ReportsSubmitted=${reportsCount}, averageResponseTime=${averageResponseTime}`);
    }

    return res.json({ success: true, insertedId: insertResult.insertedId });
  } catch (error) {
    console.error('Error in /api/action-report:', error);
    return res.status(500).json({ success: false, message: 'Failed to insert action report', error: error.message });
  }
});

app.post('/api/floormanagerstats', async (req, res) => {
  const { userId, reportsSubmitted, averageResponseTime } = req.body;

  if (!userId || reportsSubmitted === undefined || averageResponseTime === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    if (!db) throw new Error('Database not connected');
    const floorManagerStatsCollection = db.collection('floormanagerstats');

    const existingStats = await floorManagerStatsCollection.findOne({ UserId: userId });

    if (!existingStats) {
      const newStats = {
        UserId: userId,
        ReportsSubmitted: reportsSubmitted,
        averageResponseTime: averageResponseTime,
        numberOfCasesCompleted: 0,
        numberOfCasesInProgress: 1,
      };
      await floorManagerStatsCollection.insertOne(newStats);
      console.log(`Created new stats for user ${userId}:`, newStats);
    } else {
      await floorManagerStatsCollection.updateOne(
        { UserId: userId },
        {
          $set: {
            ReportsSubmitted: reportsSubmitted,
            averageResponseTime: averageResponseTime,
          },
          $inc: { numberOfCasesInProgress: 1 },
        }
      );
      console.log(`Updated stats for user ${userId}: ReportsSubmitted=${reportsSubmitted}, averageResponseTime=${averageResponseTime}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/floormanagerstats:', error);
    res.status(500).json({ success: false, message: 'Failed to update floor manager stats' });
  }
});

app.get('/api/floormanagerstats/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const floorManagerStatsCollection = db.collection('floormanagerstats');
    const stats = await floorManagerStatsCollection.findOne({ UserId: userId });
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found for this user' });
    }
    res.json(stats);
  } catch (error) {
    console.error('Error in /api/floormanagerstats/:userId:', error);
    res.status(500).json({ error: 'Failed to fetch floor manager stats' });
  }
});

app.get('/api/user-by-email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne({ email });

    if (!user) {
      console.log(`No user found for email: ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user._id.toHexString();
    console.log(`Fetched userId for email ${email}: ${userId}`);
    res.json({ userId });
  } catch (error) {
    console.error('Error in /api/user-by-email:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.get('/api/alerts/verified-completed', async (req, res) => {
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    const alerts = await collection.find({
      Verification: { $in: ['verified', 'completed'] }
    }).toArray();
    res.json(alerts);
  } catch (error) {
    console.error('Error in /api/alerts/verified-completed:', error);
    res.status(500).json([]);
  }
});

app.get('/api/alerts/inprogress-verified-completed', async (req, res) => {
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    const alerts = await collection.find({
      Verification: { $in: ['in progress', 'verified', 'completed'] }
    }).toArray();
    res.json(alerts);
  } catch (error) {
    console.error('Error in /api/alerts/inprogress-verified-completed:', error);
    res.status(500).json([]);
  }
});

app.get('/api/floor', async (req, res) => {
  const { managerName } = req.query;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('floors');
    const floor = await collection.findOne({ FloorManager: managerName });
    res.json({ floorNo: floor?.FloorNo?.toString() || null });
  } catch (error) {
    console.error('Error in /api/floor:', error);
    res.status(500).json({ floorNo: null });
  }
});

app.get('/api/action-reports/count', async (req, res) => {
  const { userId, filter } = req.query;
  try {
    console.log('Received userId for counting reports:', userId);
    console.log('Received filter for filtering reports:', filter);
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (!db) throw new Error('Database not connected');
    const collection = db.collection('actionreports');
    let query = { userId };

    if (filter && filter !== 'All') {
      const now = new Date();
      let startDate;

      if (filter === 'Last Month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (filter === 'Last 3 Months') {
        startDate = new Date(now.setMonth(now.getMonth() - 3));
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
        console.log('Applying date filter with startDate:', startDate.toISOString());
      }
    }

    const matchingDocs = await collection.find(query).toArray();
    console.log('Matching documents:', matchingDocs);

    const count = await collection.countDocuments(query);
    console.log(`Counted ${count} reports for userId: ${userId} with query:`, query);
    res.json({ count });
  } catch (error) {
    console.error('Error in /api/action-reports/count:', error);
    res.status(500).json({ count: 0 });
  }
});

app.get('/api/action-reports', async (req, res) => {
  const { userId, startDate, floorNo } = req.query;
  try {
    console.log('Received userId for fetching reports:', userId);
    console.log('Received startDate for filtering reports:', startDate);
    console.log('Received floorNo for filtering reports:', floorNo);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!floorNo) {
      return res.status(400).json({ error: 'floorNo is required' });
    }

    if (!db) throw new Error('Database not connected');
    const actionReportsCollection = db.collection('actionreports');
    const suspiciousActivitiesCollection = db.collection('suspiciousactivities');

    let query = { userId };
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }

    const reports = await actionReportsCollection.find(query).toArray();
    console.log('Fetched all reports for user:', reports);

    const filteredReports = [];
    for (const report of reports) {
      const suspiciousActivity = await suspiciousActivitiesCollection.findOne({
        SuspiciousActivityId: report.SuspiciousActivityId.trim(),
      });
      if (suspiciousActivity) {
        const activityFloorNo = suspiciousActivity.FloorNo.toString();
        console.log(`Comparing FloorNo: ${activityFloorNo} with requested floorNo: ${floorNo}`);
        if (activityFloorNo === floorNo.toString()) {
          filteredReports.push(report);
        }
      } else {
        console.warn('No suspicious activity found for SuspiciousActivityId:', report.SuspiciousActivityId);
      }
    }

    console.log('Filtered reports for floorNo:', floorNo, filteredReports);
    res.json({ reports: filteredReports });
  } catch (error) {
    console.error('Error in /api/action-reports:', error);
    res.status(500).json({ error: 'Failed to fetch action reports' });
  }
});

app.get('/api/action-reports/recommended-by-type/:type', async (req, res) => {
  const { type } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    if (!['guns', 'knife'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "guns" or "knife"' });
    }

    const actionReportsCollection = db.collection('actionreports');
    const suspiciousActivitiesCollection = db.collection('suspiciousactivities');

    // Fetch all suspicious activities of the specified type
    const suspiciousActivities = await suspiciousActivitiesCollection
      .find({ Type: type })
      .toArray();

    if (!suspiciousActivities.length) {
      console.log(`No suspicious activities found for type: ${type}`);
      return res.json({ reports: [] });
    }

    // Extract SuspiciousActivityIds
    const suspiciousActivityIds = suspiciousActivities.map(activity => activity.SuspiciousActivityId);

    // Fetch action reports matching these SuspiciousActivityIds
    const reports = await actionReportsCollection
      .find({
        SuspiciousActivityId: { $in: suspiciousActivityIds },
      })
      .sort({ rating: -1 }) // Sort by rating in descending order
      .limit(5) // Limit to top 5 reports
      .toArray();

    console.log(`Fetched ${reports.length} action reports with type "${type}"`);
    res.json({ reports });
  } catch (error) {
    console.error('Error in /api/action-reports/recommended-by-type:', error);
    res.status(500).json({ error: 'Failed to fetch recommended action reports' });
  }
});

app.get('/api/suspicious-activity/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    console.log('Looking up suspicious activity with SuspiciousActivityId:', id);
    const activity = await collection.findOne({
      SuspiciousActivityId: id.trim(),
    });
    if (!activity) {
      console.log('Suspicious activity not found for SuspiciousActivityId:', id);
      return res.status(404).json({ error: 'Suspicious activity not found' });
    }
    console.log('Found suspicious activity:', activity);
    res.json(activity);
  } catch (error) {
    console.error('Error in /api/suspicious-activity/:id:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious activity' });
  }
});

app.post('/api/store-push-token', async (req, res) => {
  const { userId, pushToken } = req.body;

  if (!userId || !pushToken) {
    return res.status(400).json({ success: false, message: 'userId and pushToken are required' });
  }

  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('users');
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { pushToken } }
    );
    console.log(`Stored push token for user ${userId}: ${pushToken}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error storing push token:', error);
    res.status(500).json({ success: false, message: 'Failed to store push token' });
  }
});

app.post('/api/alert', async (req, res) => {
  try {
    if (!db) throw new Error('Database not connected');
    const alertsCollection = db.collection('suspiciousactivities');

    const alertData = req.body;
    const newAlert = {
      ...alertData,
      Verification: 'unverified',
      TimeStamp: new Date().toISOString(),
      NotificationSent: false,
    };

    const result = await alertsCollection.insertOne(newAlert);
    console.log('New alert added:', newAlert);

    await sendNotificationForAlert(newAlert);

    res.status(201).json({ success: true, alertId: result.insertedId });
  } catch (error) {
    console.error('Error adding alert:', error);
    res.status(500).json({ error: 'Failed to add alert' });
  }
});

async function sendPushNotification(pushToken, title, body, data) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    console.log('Sending push notification with message:', JSON.stringify(message, null, 2));
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    console.log('Push notification response:', JSON.stringify(result, null, 2));
    if (result.data && result.data.status === 'error') {
      console.error('Push notification error:', JSON.stringify(result.data.details, null, 2));
    }
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

function normalizeFloor(floor) {
  if (!floor) return null;
  const match = floor.match(/\d+/);
  return match ? match[0] : floor;
}

async function sendNotificationForAlert(alert) {
  try {
    console.log('Sending notification for alert:', JSON.stringify(alert, null, 2));

    if (!alert.FloorNo) {
      console.log('Alert missing FloorNo, skipping:', alert);
      return;
    }

    const normalizedAlertFloor = normalizeFloor(alert.FloorNo.toString());
    console.log(`Checking for floor managers with floor: ${normalizedAlertFloor}`);

    const floorsCollection = db.collection('floors');
    const floorDoc = await floorsCollection.findOne({
      $or: [
        { FloorNo: normalizedAlertFloor },
        { FloorNo: parseInt(normalizedAlertFloor) },
      ],
    });

    if (!floorDoc) {
      console.log(`No floor document found for floor ${normalizedAlertFloor}`);
      return;
    }

    const managerEmail = floorDoc.email;
    console.log(`Floor ${normalizedAlertFloor} is managed by email: ${managerEmail}`);

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: managerEmail });
    if (!user) {
      console.log(`No user found with email ${managerEmail}`);
      return;
    }

    console.log(`Found user for floor ${normalizedAlertFloor}:`, JSON.stringify(user, null, 2));

    if (!user.pushToken) {
      console.log(`User ${user._id} has no pushToken, skipping notification`);
      return;
    }

    console.log(`Sending notification to pushToken: ${user.pushToken}`);
    await sendPushNotification(
      user.pushToken,
      'New Suspicious Activity Alert',
      `A new alert requires your verification on Floor ${normalizedAlertFloor}`,
      { alertId: alert._id?.toString() || 'unknown' }
    );

    console.log(`Finished sending notification for alert ${alert._id}`);

    const alertsCollection = db.collection('suspiciousactivities');
    await alertsCollection.updateOne(
      { _id: new ObjectId(alert._id) },
      { $set: { NotificationSent: true } }
    );
    console.log(`Marked alert ${alert._id} as having notification sent, status remains unverified`);
  } catch (error) {
    console.error('Error sending notification for alert:', error);
  }
}

async function checkForNewAlerts() {
  try {
    if (!db) throw new Error('Database not connected');
    console.log('Running checkForNewAlerts...');
    const alertsCollection = db.collection('suspiciousactivities');

    const newAlerts = await alertsCollection.find({
      Verification: 'unverified',
      $or: [
        { NotificationSent: { $exists: false } },
        { NotificationSent: false },
      ],
    }).toArray();
    console.log(`Found ${newAlerts.length} unverified alerts with no notification sent`);

    for (const alert of newAlerts) {
      await sendNotificationForAlert(alert);
    }
  } catch (error) {
    console.error('Error in checkForNewAlerts:', error);
  }
}

app.get('/api/action-reports/by-type/:type', async (req, res) => {
  const { type } = req.params;
  try {
    if (!db) throw new Error('Database not connected');
    if (!['gun', 'knife'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "gun" or "knife"' });
    }

    const collection = db.collection('actionreports');
    const reports = await collection.find({ type }).toArray();
    console.log(`Fetched ${reports.length} action reports with type "${type}"`);
    res.json({ reports });
  } catch (error) {
    console.error('Error in /api/action-reports/by-type:', error);
    res.status(500).json({ error: 'Failed to fetch action reports' });
  }
});

app.get('/api/alerts', async (req, res) => {
  const { status, respondedBy, startDate } = req.query;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    let query = {};

    if (status) {
      query.Verification = status;
    }
    if (respondedBy) {
      query.respondedBy = respondedBy;
    }
    if (startDate) {
      query.TimeStamp = { $gte: new Date(startDate) };
    }

    const alerts = await collection.find(query).toArray();
    res.json({ alerts });
  } catch (error) {
    console.error('Error in /api/alerts:', error);
    res.status(500).json([]);
  }
});

app.put('/api/alert/:id/update-status', async (req, res) => {
  const { id } = req.params;
  const { verification } = req.body;
  try {
    if (!db) throw new Error('Database not connected');
    const collection = db.collection('suspiciousactivities');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { Verification: verification } }
    );
    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Alert not found' });
    }
  } catch (error) {
    console.error('Error in /api/alert/:id/update-status:', error);
    res.status(500).json({ success: false, message: 'Failed to update alert status' });
  }
});

connectToMongo().then(() => {
  setInterval(checkForNewAlerts, 60000);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
});