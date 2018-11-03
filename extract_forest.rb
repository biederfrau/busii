#!/usr/bin/env ruby
# encoding: utf-8

require 'pp'
require 'set'
require 'yaml'

require_relative 'busii_utils'

ids = Set.new Dir["lowerhousing/#{KIND}/**/*.xes.yaml"].map { |f| File.basename f, ".xes.yaml" }
ids.delete ROOT.to_s

root_file = "lowerhousing/#{KIND}/#{ROOT}.xes.yaml"
root = File.read(root_file)

first_level_children = root.split('---')[2..-1].map { |event| YAML.load event }.keep_if do |event|
  event['event']['concept:endpoint'] == FLOW_START_URL && event['event']['cpee:lifecycle:transition'] == 'activity/receiving'
end.map { |event| event['event']['list']['data_receiver'].first['data'].scan(/\d+$/).first }

STDERR.puts "first_level_children are: #{first_level_children.inspect} (#{first_level_children.size})"

STDOUT.puts "strict digraph G {"
traverse_print_graphviz first_level_children, max_level: 3, indent: " "*4, ids: ids
traverse_print_graphviz [ids.first], level: nil, indent: " "*4, ids: ids until ids.empty?
STDOUT.puts "}"
