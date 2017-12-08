
var TreeModel = require('tree-model');
var tree = new TreeModel();

function FlowParser() {

}
FlowParser.prototype.parse = function (flow) {
    var self = this;
    var normalized_flow = {
        bank: flow.bank,
        startStep: flow.startStep,
        _id: flow._id,
        name: flow.name,
        description: flow.description
    };

    var current_steps = flow.steps;
    var normalized_steps = [];
    if (current_steps === undefined || current_steps.length === undefined) {
        return null;
    }
    for (z = 0; z < current_steps.length; z++) {
        var current_step = current_steps[z];
        var normalized_step = {
            name: current_step.name,
            tran_step: current_step.tran_step,
            _id: current_step._id
        };
        //----------------------------------------//
        normalized_step.transition = self.normalizeTransitions(current_step.transition, z);
        //----------------------------------------//
        normalized_steps.push(normalized_step);
    }
    normalized_flow['steps'] = normalized_steps;
    return (normalized_flow);
};
FlowParser.prototype.normalizeTransitions = function (transition, _id) {
    var cnt = 0;
    var root = null;
    var self = this;
    var normalized_transitions = [];
    var start_id = 200 * _id;
    if (transition.length === 1) {
        var current_transition = transition[0];
        var transition = {
            name: current_transition.name,
            onSuccess: current_transition.target,
            onFail: current_transition.target
        };
        normalized_transitions.push(transition);
        return (normalized_transitions);
    }
    while (cnt < transition.length) {
        var current_transition = transition[cnt++];
        var grandChild = tree.parse({name: 'GRAND_' + cnt, router: false, data: current_transition});
        var child = tree.parse({name: 'ROUTER_' + cnt, router: true, data: current_transition});
        if (root === null) {
            root = child;
        } else {
            root.addChild(grandChild);
            root = root.addChildAtIndex(child, 0);
        }
    }
    if (root === null) {
        return null;
    }
    var path = root.getPath();
    var parent = path[0];
    parent.walk(function (node) {
        var current_transition = node.model.data;
        var child = self.getRouterChild(node);
        var transition = null;
        if (node.model.router) {
            transition = {
                name: current_transition.name, //node.model.name,
                onSuccess: current_transition.target,
                onFail: child.name,
                id: start_id++
            };
        } else {
            transition = {
                name: node.model.name,
                onSuccess: current_transition.name,
                onFail: child.name,
                id: start_id++
            };
        }
        normalized_transitions.push(transition);
    });
    return (normalized_transitions);
};
FlowParser.prototype.getRouterChild = function (node) {
    if (!node.hasChildren()) {
        return ({name: 'END'});
    }
    var children = node.model.children;
    for (z = 0; z < children.length; z++) {
        var child = children[z];
        if (!child.router) {
            return (child);
        }
    }
    return null;
};
module.exports = FlowParser;

