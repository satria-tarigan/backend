const { v4: uuidv4 } = require('uuid');

// In-memory storage untuk demo (gunakan database di production)
let machineData = [];
let machineStatus = new Map();

// @desc    Ingest streaming data from machines
// @route   POST /api/v1/ingest
exports.ingestData = async (req, res) => {
  try {
    const {
      machine_id,
      timestamp,
      metrics,
      status,
      location,
      maintenance_info
    } = req.body;

    // Create data entry
    const dataEntry = {
      id: uuidv4(),
      machine_id,
      timestamp: timestamp || new Date().toISOString(),
      metrics: {
        air_temperature: metrics.air_temperature || 300,
        process_temperature: metrics.process_temperature || 310,
        rotational_speed: metrics.rotational_speed || 2860,
        torque: metrics.torque || 40,
        tool_wear: metrics.tool_wear || 0,
        quality_variant: metrics.quality_variant || 'M',
        machine_failure: metrics.machine_failure || false,
        failure_mode: metrics.failure_mode || null
      },
      status: status || 'active',
      location: location || 'unknown',
      maintenance_info: maintenance_info || {},
      received_at: new Date().toISOString()
    };

    // Store data
    machineData.push(dataEntry);

    // Update machine status
    machineStatus.set(machine_id, {
      machine_id,
      status,
      location,
      last_seen: dataEntry.timestamp,
      latest_metrics: dataEntry.metrics
    });

    // Keep only last 1000 entries per machine (memory management)
    const machineSpecificData = machineData.filter(d => d.machine_id === machine_id);
    if (machineSpecificData.length > 1000) {
      const toRemove = machineSpecificData.slice(0, -1000);
      toRemove.forEach(item => {
        const index = machineData.indexOf(item);
        if (index > -1) machineData.splice(index, 1);
      });
    }

    // Check for alerts based on new metrics
    const alerts = [];
    if (metrics.air_temperature > 320) { // 320K = 47°C
      alerts.push({
        type: 'high_air_temperature',
        severity: 'warning',
        value: metrics.air_temperature,
        threshold: 320,
        unit: 'K'
      });
    }
    if (metrics.process_temperature > 340) { // 340K = 67°C
      alerts.push({
        type: 'high_process_temperature',
        severity: 'critical',
        value: metrics.process_temperature,
        threshold: 340,
        unit: 'K'
      });
    }
    if (metrics.rotational_speed > 3500) {
      alerts.push({
        type: 'high_rotational_speed',
        severity: 'warning',
        value: metrics.rotational_speed,
        threshold: 3500,
        unit: 'rpm'
      });
    }
    if (metrics.torque > 60) {
      alerts.push({
        type: 'high_torque',
        severity: 'critical',
        value: metrics.torque,
        threshold: 60,
        unit: 'Nm'
      });
    }
    if (metrics.tool_wear > 240) { // 240 minutes = 4 hours
      alerts.push({
        type: 'tool_wear_limit',
        severity: 'warning',
        value: metrics.tool_wear,
        threshold: 240,
        unit: 'min'
      });
    }
    if (metrics.machine_failure) {
      alerts.push({
        type: 'machine_failure',
        severity: 'critical',
        value: true,
        failure_mode: metrics.failure_mode,
        message: `Machine failure detected: ${metrics.failure_mode || 'unknown'}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Data ingested successfully',
      data: {
        id: dataEntry.id,
        machine_id,
        timestamp: dataEntry.timestamp,
        alerts: alerts.length > 0 ? alerts : null
      }
    });

  } catch (error) {
    console.error('Ingest Data Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest streaming data'
    });
  }
};

// @desc    Get latest machine data
// @route   GET /api/v1/machines/:machineId/latest
exports.getLatestMachineData = async (req, res) => {
  try {
    const { machineId } = req.params;

    const latestData = machineData
      .filter(d => d.machine_id === machineId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!latestData) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this machine'
      });
    }

    res.status(200).json({
      success: true,
      data: latestData
    });
  } catch (error) {
    console.error('Get Latest Data Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve machine data'
    });
  }
};

// @desc    Get machine data history
// @route   GET /api/v1/machines/:machineId/history
exports.getMachineHistory = async (req, res) => {
  try {
    const { machineId } = req.params;
    const {
      from,
      to,
      limit = 100,
      offset = 0
    } = req.query;

    let machineSpecificData = machineData.filter(d => d.machine_id === machineId);

    // Apply date filters
    if (from) {
      const fromDate = new Date(from);
      machineSpecificData = machineSpecificData.filter(
        d => new Date(d.timestamp) >= fromDate
      );
    }
    if (to) {
      const toDate = new Date(to);
      machineSpecificData = machineSpecificData.filter(
        d => new Date(d.timestamp) <= toDate
      );
    }

    // Sort by timestamp (newest first)
    machineSpecificData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedData = machineSpecificData.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        machine_id: machineId,
        records: paginatedData,
        pagination: {
          total: machineSpecificData.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < machineSpecificData.length
        }
      }
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve machine history'
    });
  }
};

// @desc    Get all machines status
// @route   GET /api/v1/machines/status
exports.getAllMachinesStatus = async (req, res) => {
  try {
    const machines = Array.from(machineStatus.values());

    // Calculate statistics
    const stats = {
      total_machines: machines.length,
      active: machines.filter(m => m.status === 'active').length,
      inactive: machines.filter(m => m.status === 'inactive').length,
      maintenance: machines.filter(m => m.status === 'maintenance').length,
      error: machines.filter(m => m.status === 'error').length
    };

    // Get last data timestamp
    const lastDataTimestamp = machineData.length > 0
      ? machineData[machineData.length - 1].received_at
      : null;

    res.status(200).json({
      success: true,
      data: {
        machines,
        statistics: stats,
        total_data_points: machineData.length,
        last_data_received: lastDataTimestamp
      }
    });
  } catch (error) {
    console.error('Get Machines Status Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve machines status'
    });
  }
};

// @desc    Get streaming analytics
// @route   GET /api/v1/analytics
exports.getStreamingAnalytics = async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;

    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    };

    const fromDate = timeRanges[timeRange] || timeRanges['1h'];

    // Filter data by time range
    const recentData = machineData.filter(d => new Date(d.timestamp) >= fromDate);

    // Calculate averages
    const averages = {
      air_temperature: 0,
      process_temperature: 0,
      rotational_speed: 0,
      torque: 0,
      tool_wear: 0
    };

    if (recentData.length > 0) {
      averages.air_temperature = recentData.reduce((sum, d) => sum + d.metrics.air_temperature, 0) / recentData.length;
      averages.process_temperature = recentData.reduce((sum, d) => sum + d.metrics.process_temperature, 0) / recentData.length;
      averages.rotational_speed = recentData.reduce((sum, d) => sum + d.metrics.rotational_speed, 0) / recentData.length;
      averages.torque = recentData.reduce((sum, d) => sum + d.metrics.torque, 0) / recentData.length;
      averages.tool_wear = recentData.reduce((sum, d) => sum + d.metrics.tool_wear, 0) / recentData.length;
    }

    // Count failures and alerts
    const failureCount = recentData.filter(d => d.metrics.machine_failure).length;
    const qualityVariants = {
      H: recentData.filter(d => d.metrics.quality_variant === 'H').length,
      M: recentData.filter(d => d.metrics.quality_variant === 'M').length,
      L: recentData.filter(d => d.metrics.quality_variant === 'L').length
    };

    const failureModes = {};
    recentData.forEach(d => {
      if (d.metrics.failure_mode) {
        failureModes[d.metrics.failure_mode] = (failureModes[d.metrics.failure_mode] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        time_range: timeRange,
        data_points: recentData.length,
        averages,
        failure_count: failureCount,
        quality_variants: qualityVariants,
        failure_modes: failureModes,
        alert_count: recentData.filter(d =>
          d.metrics.air_temperature > 320 ||
          d.metrics.process_temperature > 340 ||
          d.metrics.rotational_speed > 3500 ||
          d.metrics.torque > 60 ||
          d.metrics.tool_wear > 240 ||
          d.metrics.machine_failure
        ).length
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve streaming analytics'
    });
  }
};