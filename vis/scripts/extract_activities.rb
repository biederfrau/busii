#!/usr/bin/env ruby
# encoding: utf-8

require_relative 'busii_utils'
require 'json'
require 'set'
require 'pp'

h = Hash.new { |h, k| h[k] = Array.new }

file = ARGV.first
kind = File.foreach(file).first(50).join.scan(/cpee:name: (.*)$/).last.first
p = File.basename file, '.xes.yaml'
h[:color] = COLORMAP_NODEKIND[kind]

events = extract_and_clean_machine_receives(file).flatten.sort_by { |e| e[:server_timestamp] }

a, b = nil, nil
events.each_cons(2) do |t, u|
  a = t[:server_timestamp] if a.nil?
  diff = u[:server_timestamp] - t[:server_timestamp]

  if diff <= 30 then
    b = u[:server_timestamp]
  else
    b = a + 0.5 if b.nil? # short intermittent ones

    h[:sections] << [a.iso8601(3), b.iso8601(3)]
    a, b = nil, nil
  end
end

unless a.nil?
  b = a + 0.5 if b.nil? # short intermittent ones
  h[:sections] << [a.iso8601(3), b.iso8601(3)]
end

_, last_b = h[:sections].last
h[:sections] << [events.last[:server_timestamp].iso8601(3), (events.last[:server_timestamp] + 0.5).iso8601(3)] unless last_b == events.last[:server_timestamp].iso8601(3)

pp h
File.write File.join('..', 'data', p, 'activities.json'), JSON::generate(h)
