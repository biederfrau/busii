#!/usr/bin/env ruby
# encoding: utf-8

require 'fileutils'

dir = ARGV.first

Dir[File.join dir, '**', '*.xes.yaml'].keep_if { |f| File.foreach(f).first(50).join.include? 'Machining' }.each do |f|
  p = File.basename f, '.xes.yaml'
  FileUtils.mkdir_p File.join '..', 'data', p

  puts "process #{p}"
  threads = []

  threads << Thread.new do
    `ruby misc.rb #{f}`
  end

  threads << Thread.new do
    `ruby activities.rb #{f}`
  end

  threads << Thread.new do
    `ruby time_series.rb #{f}`
  end

  threads << Thread.new do
    path = File.join '..', 'data', p, 'positions.csv'
    `ruby extract_positions.rb #{f} > #{path}`
    `python cluster_coords.py #{path}`
  end

  threads << Thread.new do
    `ruby timestamps.rb #{f}`
  end

  threads.each &:join
end
