'use strict';
/* globals module, require */

var posts = require.main.require('./src/posts'),
	apiMiddleware = require('./middleware'),
	errorHandler = require('../../lib/errorHandler'),
	utils = require('./utils');


module.exports = function(middleware) {
	var app = require('express').Router();

	app.route('/:pid')
		.put(apiMiddleware.requireUser, function(req, res) {
			if (!utils.checkRequired(['content'], req, res)) {
				return false;
			}

			var payload = {
				uid: req.user.uid,
				pid: req.params.pid,
				content: req.body.content,
				options: {}
			};

			if (req.body.handle) { payload.handle = req.body.handle; }
			if (req.body.title) { payload.title = req.body.title; }
			if (req.body.topic_thumb) { payload.options.topic_thumb = req.body.topic_thumb; }
			if (req.body.tags) { payload.options.tags = req.body.tags; }

			posts.edit(payload, function(err) {
				errorHandler.handle(err, res);
			})
		})
		.delete(apiMiddleware.requireUser, apiMiddleware.validatePid, function(req, res) {
			posts.purge(req.params.pid, req.user.uid, function(err) {
				errorHandler.handle(err, res);
			});
		});
	
	app.route('/:pid/state')
		.put(apiMiddleware.requireUser, apiMiddleware.validatePid, function (req, res) {
			posts.restore(req.params.pid, req.user.uid, function (err) {
				errorHandler.handle(err, res);
			});
		})
		.delete(apiMiddleware.requireUser, apiMiddleware.validatePid, function (req, res) {
			posts.delete(req.params.pid, req.user.uid, function (err) {
				errorHandler.handle(err, res);
			});
		});
		
	app.route('/:pid/vote')
		.post(apiMiddleware.requireUser, function(req, res) {
			if (!utils.checkRequired(['delta'], req, res)) {
				return false;
			}
			if (typeof req.body.delta !== 'number') {
				res.status(400).json(errorHandler.generate(
					400, 'invalid-params',
					'Required parameters were used incorrectly in this API call, please see the "params" property',
					['delta']
				));
				return false;
			}

			var payload = {
				uid: req.user.uid,
				pid: req.params.pid,
				delta: req.body.delta
			}

			if (req.body.delta > 0) {
				posts.upvote(payload.pid, payload.uid, function(err, data) {
					errorHandler.handle(err, res, data);
				})
			} else {
				posts.downvote(payload.pid, payload.uid, function(err, data) {
					errorHandler.handle(err, res, data);
				})
			}
		})
		.delete(apiMiddleware.requireUser, function(req, res) {
			var payload = {
				uid: req.user.uid,
				pid: req.params.pid
			}
			
			posts.unvote(payload.pid, payload.uid, function(err, data) {
				errorHandler.handle(err, res, data);
			})
		});

	return app;
};
