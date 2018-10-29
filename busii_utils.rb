# encoding: utf-8

require 'time'
require 'yaml'

FLOW_START_URL = "https://centurio.work/flow/start/url/"
KIND = "production"
ROOT = 179

# turning is kinda blue, milling kinda red.
COLORMAP_NODEKIND = {
  "Lowerhousing Production" => "#a2cd5a",
  "Lowerhousing Turn 1 Production" => "#1e90ff",
  "Lowerhousing Turn 2 Production" => "#4169e1",
  "Lowerhousing Mill 1 Production" => "#ff3030",
  "Lowerhousing Mill 2 Production" => "#8b1a1a",

  "Lowerhousing Turn 1 Machining" => "#87cefa",
  "Lowerhousing Turn 2 Machining" => "#6f8ee7",
  "Lowerhousing Mill 1 Machining" => "#fa8072",
  "Lowerhousing Mill 2 Machining" => "#cd4f39",

  "Plain Instance" => "#ffde00" # what ARE you
}

# takes the first level (or whatever level) children of tree. done that way because
# the format for root is slightly different (id contained in path instead of receiving event payload or whatever)
#
# assumes that files were renamed from their uuid to the trace-id.
def traverse_print_graphviz(kiddos, level: 1, max_level: nil, indent: "", ids: nil)
  return if !max_level.nil? && level >= max_level

  kiddos.each do |kiddo|
    STDOUT.puts "#{indent}#{ROOT} -> #{kiddo}" if level == 1
    path = Dir["lowerhousing/#{KIND}/**/#{kiddo}.xes.yaml"].first
    file = File.read path rescue nil

    ids&.delete kiddo

    if file.nil? then
      STDERR.puts "[INFO] child #{kiddo} does not have logs! what do??? continuing ..."
      next
    end

    if level == 1 || level.nil? then
      kind = file.scan(/cpee:name: (.*)$/).last.first
      part = path.scan(/part(\d)/).first.first
      STDOUT.puts "#{indent}#{kiddo} [label=<#{kiddo}<BR/><FONT POINT-SIZE=\"8\">#{kind.sub('Lowerhousing ', '') + ' P' + part}</FONT>>, style=filled, fillcolor=\"#{COLORMAP_NODEKIND[kind]}\"]"
    end

    next_gen = file.split('---')[2..-1].map { |event| YAML.load event }.keep_if do |event|
      event['event']['concept:endpoint'] == FLOW_START_URL && event['event']['cpee:lifecycle:transition'] == 'activity/receiving'
    end.map { |event| event['event']['list']['data_receiver'].keep_if { |recv| recv['name'] == 'instance' || recv['data']['CPEE-INSTANCE'] } }.flatten.map do |x|
      x['data'] = x['data']['CPEE-INSTANCE'].scan(/\d+$/).first if x['data'].is_a? Hash
      x['data']
    end

    next_gen.each do |child|
      path = Dir["lowerhousing/#{KIND}/**/#{child}.xes.yaml"].first
      head = File.foreach(path).first(50).join
      kind = head.scan(/cpee:name: (.*)$/).last.first
      part = path.scan(/part(\d)/).first.first

      STDOUT.puts "#{indent}#{child} [label=<#{child}<BR/><FONT POINT-SIZE=\"8\">#{kind.sub('Lowerhousing ', '') + ' P' + part}</FONT>>, style=filled, fillcolor=\"#{COLORMAP_NODEKIND[kind]}\"]"
      STDOUT.puts "#{indent}#{kiddo} -> #{child}"

      ids&.delete child
    end

    traverse_print_graphviz next_gen, level: level&.+(1), max_level: max_level, indent: indent, ids: ids
  end
end

def extract_positions_with_timestamp(paths)
  coords = Hash.new { |h, i| h[i] = [] }
  paths.each do |path|
    events = File.read(path).split('---')

    next unless events[1].scan(/cpee:name:.*$/).last.include? 'Machining'
    events[2..-1].map { |event| YAML.load event }.keep_if do |event|
      event['event']['concept:name'] == 'Fetch' && event['event']['cpee:lifecycle:transition'] == 'activity/receiving'
    end.map { |event| event['event']['list']['data_receiver'].first['data'].keep_if { |thingy| thingy.dig('name').include? 'LeadP' } }.keep_if { |l| !l.empty? }.each do |snippet|
      pp snippet

      next
      if snippet.empty? then
        STDERR.puts "[INFO] got empty snippet. thats weird BUT OKAY I GUESS"
        next
      end

      coord = snippet['name'].scan(/Axis\/(X|Y|Z)\/aaLeadP/).first.first
      coords[coord] << [Time.parse(snippet['timestamp']), snippet['value'].to_f]
    end
  end

  coords
end

def extract_and_clean_machine_receives(file)
  File.read(file).split('---')[2..-1].map { |event| YAML.load event }.keep_if do |event|
    event['event']['concept:name'] == 'Fetch' && event['event']['cpee:lifecycle:transition'] == 'activity/receiving'
  end.map { |event| event['event']['list']['data_receiver'].first['data'] rescue [] }.map do |ugly_events|
    ugly_events.map do |ugly_event|
      {
        name: ugly_event['name'],
        timestamp: Time.parse(ugly_event['timestamp']),
        server_timestamp: Time.parse(ugly_event['meta']['ServerTimestamp']),
        value: case ugly_event['name'].split('/').last
               when 'aaLeadP', 'aaTorque', 'aaLoad', 'driveLoad', 'actSpeed', 'aaVactB', 'feedRateOvr', 'actToolRadius', 'actToolLength1', 'speedOvr' then ugly_event['value'].to_f
               when 'progStatus', 'resetActive', 'acAlarmStat', 'turnState', 'actTNumber', 'findBlActive' then ugly_event['value'].to_i
               when 'blockNoStr', 'msg', 'actBlock', 'actToolIdent', 'progName1' then ugly_event['value']
               else puts "unexpected: #{ugly_event['name']}"; end,
        origin: File.basename(file, '.xes.yaml').to_i
      }
    end
  end
end

def extract_all_timestamps(file)
  File.read(file).split('---')[2..-1].map { |event| YAML.load event }.map do |event|
    {
      timestamp: Time.parse(event['event']['time:timestamp']),
      origin: File.basename(file, '.xes.yaml').to_i
    }
  end
end
