#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require_relative 'busii_utils'

file = ARGV.first
p = File.basename file, '.xes.yaml'
events = extract_and_clean_machine_receives(file).flatten.map { |e| e[:server_timestamp] }.sort.uniq

File.write File.join('..', 'data', p, 'timestamps.json'), JSON::generate(events.map { |x| x.iso8601(3) })
