#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'pp'
require 'yaml'

require_relative 'busii_utils'

root_file = "../../lowerhousing/#{KIND}/#{ROOT}.xes.yaml"

nodes = [[nil, File.basename(root_file, '.xes.yaml')]]
result = []

until nodes.empty? do
  parent, node = nodes.pop
  path = Dir["../../lowerhousing/#{KIND}/**/#{node}.xes.yaml"].first
  file = File.read path rescue ''

  head = File.foreach(path).first(50).join rescue '???'
  kind = head.scan(/cpee:name: (.*)$/).last.first rescue '???'
  part = path.scan(/part(\d)/).first.first rescue '???'

  result << {parent: parent, id: node, name: "#{node} (#{kind.sub('Lowerhousing ', '')} P#{part})"}
  puts "#{parent} -> #{node}"

  children = file.split('---')[2..-1].map { |event| YAML.load event }.keep_if do |event|
    event['event']['concept:endpoint'] == FLOW_START_URL && event['event']['cpee:lifecycle:transition'] == 'activity/receiving'
  end.map { |event| event['event']['list']['data_receiver'].keep_if { |recv| ['instance', 'url'].include?(recv['name']) || recv['data']['CPEE-INSTANCE'] } }.flatten.map do |x|
    x['data'] = x['data']['CPEE-INSTANCE'].scan(/\d+$/).first if x['data'].is_a? Hash
    x['data'] = x['data'].scan(/\d+$/).first if result.size == 1
    x['data']
  end rescue []

  children.sort_by! { |x| x.to_i }.reverse.each do |child|
    nodes << [node, child] unless path.nil?
  end
end

File.write '../data/tree.json', JSON::generate(result)
