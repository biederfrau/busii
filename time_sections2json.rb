#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'pp'

require_relative 'busii_utils'

h = Hash.new { |h, k| h[k] = Hash.new { |hh, kk| hh[kk] = Array.new } }

Dir['lowerhousing/production/**/*.xes.yaml'].each do |file|
  kind = File.foreach(file).first(50).join.scan(/cpee:name: (.*)$/).last.first
  p = File.basename file, '.xes.yaml'
  timestamps = extract_all_timestamps file

  if timestamps.empty? then
    puts "[INFO] #{p} has no timestamps?!"
    next
  end

  puts p
  h[p][:color] = COLORMAP_NODEKIND[kind]

  a, b = nil, nil
  timestamps.sort_by { |e| e[:timestamp] }.each_cons(2) do |t, u|
    a = t[:timestamp] if a.nil?
    diff = u[:timestamp] - t[:timestamp]

    if diff <= 30 then
      b = u[:timestamp]
    else
      b = a + 0.5 if b.nil? # short intermittent ones

      h[p][:sections] << [a.iso8601(3), b.iso8601(3)]
      a, b = nil, nil
    end
  end

  unless a.nil?
    b = a + 0.5 if b.nil? # short intermittent ones
    h[p][:sections] << [a.iso8601(3), b.iso8601(3)]
  end
end

File.write 'processed_data/time_sections.json', h.to_json
