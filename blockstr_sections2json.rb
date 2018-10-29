#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'pp'

require_relative 'busii_utils'

h = Hash.new { |h, k| h[k] = Hash.new { |hh, kk| hh[kk] = Array.new } }
Dir['lowerhousing/production/**/*.xes.yaml'].each do |file|
  kind = File.foreach(file).first(50).join.scan(/cpee:name: (.*)$/).last.first
  next unless kind.include? 'Machining'

  p = File.basename file, '.xes.yaml'
  recvs = extract_and_clean_machine_receives(file).flatten.select { |e| e[:name].end_with? 'blockNoStr' }

  if recvs.size <= 1 then
    puts "[INFO] #{p} has no (or only one) blockNoStr receives!"
    next
  end

  puts p
  h[p][:color] = COLORMAP_NODEKIND[kind]

  a, b = nil, nil
  recvs.sort_by { |x| x[:timestamp] }.each_cons(2) do |e, f|
    next if e[:value].empty? || e[:value] == 'None' # skip that mofo, cant start a section with reset smh

    ee, ff = [e, f].map { |x| x[:value][1..-1].to_i }
    diff_block = ff - ee

    a = ee if a.nil?

    if 0 < diff_block && diff_block <= 15 then
      # ok whatever
      b = ff
    elsif f[:value].empty? || f[:value] == 'None' then
      # got reset somehow
      b = a + 2 if b.nil? # one-time events

      h[p][:sections] << [a, b]
      a, b = nil, nil
    else
      # gap too large
      diff_time = f[:timestamp] - e[:timestamp]

      if diff_time / diff_block >= 20 then # feed rate??
        # some time passed, this might not actually be a jump but missing events.
        b = ff
        next
      end

      b = a + 2 if b.nil?
      h[p][:sections] << [a, b]
      a, b = nil, nil
    end
  end

  unless a.nil?
    b = a + 2 if b.nil?
    h[p][:sections] << [a, b]
  end
end

File.write 'block_sections.json', h.to_json
