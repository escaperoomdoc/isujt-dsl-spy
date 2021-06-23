{"success":true,"totalCount":0,"data":"Module.create :UthCrewModule do\n\tdescription \"Сервис передачи данных ИСУЖТ (УТХ) в ЕК АСУТ 2021-06-04 14:17:25 +0300\"\n\tmodules :SOAPInit\n\tmethods :namesoap => %q{def namesoap; 'UthCrew'; end},\n\t\t:service_role => %q{def service_role; nil; end},\n\t\t:getShedules => %q{##{} \n\t\tdef getShedules args\n\t\t\targs = in_SheduleRequest( args )\n\t\t\tresult = {}\n\n\t\t\t@logger.info \"SoapMethod[#{namesoap}.getShedules] start\"\n\t\t\t\n\n\t\t\t$log.info @wsd\n\t\t\t@user = User.getSoapUser\n\t\t\t\n\n\t\t\tbegin\n\t\t\t\t\n\t\t\t\t\t@logger.info args.inspect\n\n\t\t\t\t\tresult = User::UthCrewService.getShedules(args)\n\n\n\t\t\trescue => err\n\t\t\t\t@logger.error \"SoapMethod[#{namesoap}.getShedules] error [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\terror \"SoapMethod[#{namesoap}.getShedules] error [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\traise err.message\n\t\t\tend\n\t\t\t\n\t\t\t@logger.info \"SoapMethod[#{namesoap}.getShedules] finish\"\n\n\t\t\tbegin\n\t\t\t\tout_SheduleResponse( result )\n\t\t\trescue => err\n\t\t\t\t@logger.error \"SoapMethod[#{namesoap}.getShedules] ошибка структуры данных [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\terror \"SoapMethod[#{namesoap}.getShedules] ошибка структуры данных [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\traise err.message\n\t\t\tend\n\t\tend},\n\t\t:getTurnouts => %q{##{} \n\t\tdef getTurnouts args\n\t\t\targs = in_TurnoutRequest( args )\n\t\t\tresult = {}\n\n\t\t\t@logger.info \"SoapMethod[#{namesoap}.getTurnouts] start\"\n\t\t\t\n\n\t\t\t$log.info @wsd\n\t\t\t@user = User.getSoapUser\n\t\t\t\n\n\t\t\tbegin\n\t\t\t\t\n\t\t\t\t\t@logger.info args.inspect\n\n\t\t\t\t\tresult = User::UthCrewService.getTurnouts(args)\n\n\n\t\t\trescue => err\n\t\t\t\t@logger.error \"SoapMethod[#{namesoap}.getTurnouts] error [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\terror \"SoapMethod[#{namesoap}.getTurnouts] error [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\traise err.message\n\t\t\tend\n\t\t\t\n\t\t\t@logger.info \"SoapMethod[#{namesoap}.getTurnouts] finish\"\n\n\t\t\tbegin\n\t\t\t\tout_TurnoutResponse( result )\n\t\t\trescue => err\n\t\t\t\t@logger.error \"SoapMethod[#{namesoap}.getTurnouts] ошибка структуры данных [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\terror \"SoapMethod[#{namesoap}.getTurnouts] ошибка структуры данных [result => '#{result}']  message: #{err.message}\n\t#{err.backtrace.join(\"\\n\\t\")}\"\n\t\t\t\traise err.message\n\t\t\tend\n\t\tend},\n\t\t:out_Shedule => %q{ # {}\n\t\t\t\t\tdef out_Shedule data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{Shedule: {\n\t\t\t\t\t\t\tid: data[:id],\n\t\t\t\t\t\t\ttn: data[:tn],\n\t\t\t\t\t\t\tfio: data[:fio],\n\t\t\t\t\t\t\tdate: data[:date],\n\t\t\t\t\t\t\tplace: data[:place],\n\t\t\t\t\t\t\tperiod: data[:period],\n\t\t\t\t\t\t\trouteRest: data[:routeRest],\n\t\t\t\t\t\t\thomeRest: data[:homeRest],\n\t\t\t\t\t\t\tmonthWorkTime: data[:monthWorkTime],\n\t\t\t\t\t\t\tplanRouteTime: data[:planRouteTime],\n\t\t\t\t\t\t\tuolb: data[:uolb],\n\t\t\t\t\t\t\tisHoliday: data[:isHoliday],\n\t\t\t\t\t\t\tisCanceled: data[:isCanceled],\n\t\t\t\t\t\t\tisDeleted: data[:isDeleted],\n\t\t\t\t\t\t\tmodifyTime: data[:modifyTime]\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_Shedule => %q{ # {}\n\t\t\t\t\tdef in_Shedule data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tid: data.has_key?(:Shedule) ? data[:Shedule][:id] : data[:id],\n\t\t\t\t\t\t\ttn: data.has_key?(:Shedule) ? data[:Shedule][:tn] : data[:tn],\n\t\t\t\t\t\t\tfio: data.has_key?(:Shedule) ? data[:Shedule][:fio] : data[:fio],\n\t\t\t\t\t\t\tdate: data.has_key?(:Shedule) ? data[:Shedule][:date] : data[:date],\n\t\t\t\t\t\t\tplace: data.has_key?(:Shedule) ? data[:Shedule][:place] : data[:place],\n\t\t\t\t\t\t\tperiod: data.has_key?(:Shedule) ? data[:Shedule][:period] : data[:period],\n\t\t\t\t\t\t\trouteRest: data.has_key?(:Shedule) ? data[:Shedule][:routeRest] : data[:routeRest],\n\t\t\t\t\t\t\thomeRest: data.has_key?(:Shedule) ? data[:Shedule][:homeRest] : data[:homeRest],\n\t\t\t\t\t\t\tmonthWorkTime: data.has_key?(:Shedule) ? data[:Shedule][:monthWorkTime] : data[:monthWorkTime],\n\t\t\t\t\t\t\tplanRouteTime: data.has_key?(:Shedule) ? data[:Shedule][:planRouteTime] : data[:planRouteTime],\n\t\t\t\t\t\t\tuolb: data.has_key?(:Shedule) ? data[:Shedule][:uolb] : data[:uolb],\n\t\t\t\t\t\t\tisHoliday: data.has_key?(:Shedule) ? data[:Shedule][:isHoliday] : data[:isHoliday],\n\t\t\t\t\t\t\tisCanceled: data.has_key?(:Shedule) ? data[:Shedule][:isCanceled] : data[:isCanceled],\n\t\t\t\t\t\t\tisDeleted: data.has_key?(:Shedule) ? data[:Shedule][:isDeleted] : data[:isDeleted],\n\t\t\t\t\t\t\tmodifyTime: data.has_key?(:Shedule) ? data[:Shedule][:modifyTime] : data[:modifyTime]\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:out_SheduleRequest => %q{ # {}\n\t\t\t\t\tdef out_SheduleRequest data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{SheduleRequest: {\n\t\t\t\t\t\t\tlastTime: data[:lastTime]\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_SheduleRequest => %q{ # {}\n\t\t\t\t\tdef in_SheduleRequest data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tlastTime: data.has_key?(:SheduleRequest) ? data[:SheduleRequest][:lastTime] : data[:lastTime]\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:out_SheduleResponse => %q{ # {}\n\t\t\t\t\tdef out_SheduleResponse data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{SheduleResponse: {\n\t\t\t\t\t\t\tShedules: {Shedules: data[:Shedules].map{|h| out_Shedule(h)}}\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_SheduleResponse => %q{ # {}\n\t\t\t\t\tdef in_SheduleResponse data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tShedules: data[:SheduleResponse][:Shedules][:Shedules].map{|h| in_Shedule(h)}\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:out_Turnout => %q{ # {}\n\t\t\t\t\tdef out_Turnout data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{Turnout: {\n\t\t\t\t\t\t\tid: data[:id],\n\t\t\t\t\t\t\ttn: data[:tn],\n\t\t\t\t\t\t\tplace: data[:place],\n\t\t\t\t\t\t\tturnoutTime: data[:turnoutTime],\n\t\t\t\t\t\t\tuolb: data[:uolb],\n\t\t\t\t\t\t\tisCanceled: data[:isCanceled],\n\t\t\t\t\t\t\tisDeleted: data[:isDeleted],\n\t\t\t\t\t\t\tmodifyTime: data[:modifyTime]\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_Turnout => %q{ # {}\n\t\t\t\t\tdef in_Turnout data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tid: data.has_key?(:Turnout) ? data[:Turnout][:id] : data[:id],\n\t\t\t\t\t\t\ttn: data.has_key?(:Turnout) ? data[:Turnout][:tn] : data[:tn],\n\t\t\t\t\t\t\tplace: data.has_key?(:Turnout) ? data[:Turnout][:place] : data[:place],\n\t\t\t\t\t\t\tturnoutTime: data.has_key?(:Turnout) ? data[:Turnout][:turnoutTime] : data[:turnoutTime],\n\t\t\t\t\t\t\tuolb: data.has_key?(:Turnout) ? data[:Turnout][:uolb] : data[:uolb],\n\t\t\t\t\t\t\tisCanceled: data.has_key?(:Turnout) ? data[:Turnout][:isCanceled] : data[:isCanceled],\n\t\t\t\t\t\t\tisDeleted: data.has_key?(:Turnout) ? data[:Turnout][:isDeleted] : data[:isDeleted],\n\t\t\t\t\t\t\tmodifyTime: data.has_key?(:Turnout) ? data[:Turnout][:modifyTime] : data[:modifyTime]\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:out_TurnoutRequest => %q{ # {}\n\t\t\t\t\tdef out_TurnoutRequest data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{TurnoutRequest: {\n\t\t\t\t\t\t\tlastTime: data[:lastTime],\n\t\t\t\t\t\t\tlastId: data[:lastId]\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_TurnoutRequest => %q{ # {}\n\t\t\t\t\tdef in_TurnoutRequest data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tlastTime: data.has_key?(:TurnoutRequest) ? data[:TurnoutRequest][:lastTime] : data[:lastTime],\n\t\t\t\t\t\t\tlastId: data.has_key?(:TurnoutRequest) ? data[:TurnoutRequest][:lastId] : data[:lastId]\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:out_TurnoutResponse => %q{ # {}\n\t\t\t\t\tdef out_TurnoutResponse data\n\t\t\t\t\t\t\n\t\t\t\t\t\t{TurnoutResponse: {\n\t\t\t\t\t\t\tTurnouts: {Turnouts: data[:Turnouts].map{|h| out_Turnout(h)}}\n\t\t\t\t\t\t}}\n\t\t\t\t\tend\n\t\t\t\t},\n\t\t:in_TurnoutResponse => %q{ # {}\n\t\t\t\t\tdef in_TurnoutResponse data\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\tTurnouts: data[:TurnoutResponse][:Turnouts][:Turnouts].map{|h| in_Turnout(h)}\n\t\t\t\t\t\t}\n\t\t\t\t\tend\n\t\t\t\t}\nend","settings":0,"type":"0","model_name":"0"}