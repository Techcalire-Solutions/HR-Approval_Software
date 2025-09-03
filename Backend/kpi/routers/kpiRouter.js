/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Designation = require('../../users/models/designation');
const User = require('../../users/models/user');
const Kpi = require('../models/kpi');
const DesignationKpi = require('../models/designationKpi');
const KpiEvaluation = require('../models/kpiEvaluation');

// 1. Get all KPIs for a specific designation
router.get('/designations/:designationId/kpis', async (req, res) => {
    try {
        const designationKpis = await DesignationKpi.findAll({
            where: { designationId: req.params.designationId },
            include: [Kpi]
        });
        
        res.json(designationKpis.map(dk => ({
            id: dk.kpiId,
            parameter: dk.Kpi.parameter,
            createdAt: dk.createdAt,
            updatedAt: dk.updatedAt
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Add KPI to a designation
router.post('/designations/:designationId/kpis', async (req, res) => {
    try {
        const { kpiId } = req.body;
        
        // Check if KPI exists
        const kpi = await Kpi.findByPk(kpiId);
        if (!kpi) {
            return res.status(404).json({ error: 'KPI not found' });
        }
        
        // Check if designation exists
        const designation = await Designation.findByPk(req.params.designationId);
        if (!designation) {
            return res.status(404).json({ error: 'Designation not found' });
        }
        
        // Check if mapping already exists
        const existingMapping = await DesignationKpi.findOne({
            where: {
                designationId: req.params.designationId,
                kpiId: kpiId
            }
        });
        
        if (existingMapping) {
            return res.status(400).json({ error: 'This KPI is already assigned to the designation' });
        }
        
        // Create new mapping
        const designationKpi = await DesignationKpi.create({
            designationId: req.params.designationId,
            kpiId: kpiId
        });
        
        res.status(201).json(designationKpi);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Remove KPI from designation
router.delete('/designations/:designationId/kpis/:kpiId', async (req, res) => {
    try {
        const rowsDeleted = await DesignationKpi.destroy({
            where: {
                designationId: req.params.designationId,
                kpiId: req.params.kpiId
            }
        });
        
        if (rowsDeleted === 0) {
            return res.status(404).json({ error: 'Mapping not found' });
        }
        
        res.json({ message: 'KPI removed from designation successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Submit KPI evaluation
router.post('/evaluations', async (req, res) => {
    try {
        const { userId, kpiId, score, comments, evaluationMonth, evaluatedBy } = req.body;
        
        // Validate score
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'Score must be between 0 and 100' });
        }
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if KPI exists for user's designation
        const validKpi = await DesignationKpi.findOne({
            where: {
                designationId: user.designationId,
                kpiId: kpiId
            }
        });
        
        if (!validKpi) {
            return res.status(400).json({ error: 'This KPI is not assigned to the user\'s designation' });
        }
        
        // Check if evaluator exists
        const evaluator = await User.findByPk(evaluatedBy);
        if (!evaluator) {
            return res.status(404).json({ error: 'Evaluator not found' });
        }
        
        // Create evaluation
        const evaluation = await KpiEvaluation.create({
            userId,
            kpiId,
            score,
            comments,
            evaluationMonth,
            evaluatedBy
        });
        
        res.status(201).json(evaluation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Get evaluations for a user in a specific month
router.get('/users/:userId/evaluations', async (req, res) => {
    try {
        if (!req.query.month) {
            return res.status(400).json({ error: 'Month parameter is required' });
        }
        
        const evaluations = await KpiEvaluation.findAll({
            where: {
                userId: req.params.userId,
                evaluationMonth: req.query.month
            },
            include: [
                { model: Kpi },
                { model: User, as: 'EvaluatedBy', attributes: ['id', 'name'] }
            ]
        });
        
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Get all evaluations for a team (users with same designation) in a month
router.get('/teams/:designationId/evaluations', async (req, res) => {
    try {
        if (!req.query.month) {
            return res.status(400).json({ error: 'Month parameter is required' });
        }
        
        // Get all users with this designation
        const users = await User.findAll({
            where: { designationId: req.params.designationId },
            attributes: ['id']
        });
        
        const userIds = users.map(user => user.id);
        
        const evaluations = await KpiEvaluation.findAll({
            where: {
                userId: { [Op.in]: userIds },
                evaluationMonth: req.query.month
            },
            include: [
                { model: Kpi },
                { model: User, attributes: ['id', 'name'] },
                { model: User, as: 'EvaluatedBy', attributes: ['id', 'name'] }
            ]
        });
        
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;